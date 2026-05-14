import Registration from '../models/Registration.js';
import Workshop from '../models/Workshop.js';
import User from '../models/User.js';
import { generateExcelReport } from '../utils/excelExport.js';

export const registerForWorkshop = async (req, res) => {
  try {
    const { workshopId, formData } = req.body;

    // Check if workshop exists
    const workshop = await Workshop.findById(workshopId);
    if (!workshop) {
      return res.status(404).json({ message: 'Workshop not found' });
    }

    if (workshop.isStopped || !workshop.registrationsOpen) {
      return res.status(400).json({ message: 'Registrations are closed for this workshop' });
    }

    // Check if already registered
    const existingRegistration = await Registration.findOne({
      workshopId,
      userId: req.user.id
    });

    if (existingRegistration) {
      const statusMessages = {
        pending: 'Your registration is already under review',
        confirmed: 'You are already confirmed for this workshop',
        rejected: 'Your registration was rejected. Please contact support for help.',
        cancelled: 'This registration was cancelled. Please contact support if you need help.'
      };
      return res.status(400).json({ message: statusMessages[existingRegistration.status] || 'You are already registered for this workshop' });
    }

    // Check capacity
    if (workshop.capacity) {
      const registrationCount = await Registration.countDocuments({
        workshopId,
        status: 'confirmed'
      });

      if (registrationCount >= workshop.capacity) {
        return res.status(400).json({ message: 'Workshop is full' });
      }
    }

    const registration = new Registration({
      workshopId,
      userId: req.user.id,
      formData,
      status: 'pending'
    });

    await registration.save();

    res.status(201).json({
      success: true,
      message: 'Registration submitted for review',
      registration
    });
  } catch (error) {
    res.status(500).json({ message: 'Error registering for workshop', error: error.message });
  }
};

export const getUserRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.find({ userId: req.user.id })
      .populate('workshopId')
      .sort({ createdAt: -1 });

    res.json(registrations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching registrations', error: error.message });
  }
};

export const getWorkshopRegistrations = async (req, res) => {
  try {
    const { workshopId } = req.params;

    // Check if workshop exists and user is admin
    const workshop = await Workshop.findById(workshopId);
    if (!workshop) {
      return res.status(404).json({ message: 'Workshop not found' });
    }

    const registrations = await Registration.find({ workshopId })
      .populate('userId', 'name email profilePhoto')
      .sort({ createdAt: -1 });

    res.json(registrations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching registrations', error: error.message });
  }
};

export const cancelRegistration = async (req, res) => {
  try {
    const { registrationId } = req.params;

    const registration = await Registration.findById(registrationId);
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    if (registration.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const wasConfirmed = registration.status === 'confirmed';
    registration.status = 'cancelled';
    await registration.save();

    // Update registration count
    const workshop = await Workshop.findById(registration.workshopId);
    if (wasConfirmed && workshop && workshop.registrationCount > 0) {
      workshop.registrationCount -= 1;
      await workshop.save();
    }

    res.json({ success: true, message: 'Registration cancelled' });
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling registration', error: error.message });
  }
};

export const exportRegistrationsToExcel = async (req, res) => {
  try {
    const { workshopId } = req.params;

    const workshop = await Workshop.findById(workshopId);
    if (!workshop) {
      return res.status(404).json({ message: 'Workshop not found' });
    }

    const registrations = await Registration.find({ workshopId, status: 'confirmed' })
      .populate('userId', 'name email');

    const workbook = await generateExcelReport(registrations, workshop.title, workshop.registrationFormFields);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${workshop.title}-registrations.xlsx"`);

    await workbook.xlsx.write(res);
  } catch (error) {
    res.status(500).json({ message: 'Error exporting registrations', error: error.message });
  }
};

export const updateRegistrationStatus = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { status } = req.body;

    if (!['confirmed', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid registration status' });
    }

    const registration = await Registration.findById(registrationId);
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    const workshop = await Workshop.findById(registration.workshopId);
    if (!workshop) {
      return res.status(404).json({ message: 'Workshop not found' });
    }

    const previousStatus = registration.status;

    if (status === 'confirmed' && previousStatus !== 'confirmed' && workshop.capacity) {
      const confirmedCount = await Registration.countDocuments({
        workshopId: registration.workshopId,
        status: 'confirmed'
      });

      if (confirmedCount >= workshop.capacity) {
        return res.status(400).json({ message: 'Workshop is full' });
      }
    }

    registration.status = status;
    registration.updatedAt = new Date();
    await registration.save();

    if (previousStatus !== status) {
      if (status === 'confirmed' && previousStatus !== 'confirmed') {
        workshop.registrationCount = (workshop.registrationCount || 0) + 1;
        await workshop.save();
      }

      if (previousStatus === 'confirmed' && status !== 'confirmed' && workshop.registrationCount > 0) {
        workshop.registrationCount -= 1;
        await workshop.save();
      }
    }

    await registration.populate('userId', 'name email profilePhoto');

    res.json({
      success: true,
      message: status === 'confirmed' ? 'Registration approved' : 'Registration rejected',
      registration
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating registration status', error: error.message });
  }
};

export const deleteRegistration = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { workshopId } = req.body;

    const workshop = await Workshop.findById(workshopId);
    if (!workshop) {
      return res.status(404).json({ message: 'Workshop not found' });
    }

    const registration = await Registration.findByIdAndDelete(registrationId);
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    // Update registration count
    if (registration.status === 'confirmed' && workshop.registrationCount > 0) {
      workshop.registrationCount -= 1;
      await workshop.save();
    }

    res.json({ success: true, message: 'Registration deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting registration', error: error.message });
  }
};
