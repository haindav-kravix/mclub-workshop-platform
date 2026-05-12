import Workshop from '../models/Workshop.js';
import Registration from '../models/Registration.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const parseRegistrationFormFields = (fields) => {
  if (!fields) return [];
  if (Array.isArray(fields)) return fields;
  if (typeof fields !== 'string') return fields;

  try {
    const parsed = JSON.parse(fields);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const parseDailyTimings = (timings) => {
  if (!timings) return [];
  if (Array.isArray(timings)) return timings;
  if (typeof timings !== 'string') return [];

  try {
    const parsed = JSON.parse(timings);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const createWorkshop = async (req, res) => {
  try {
    const {
      title,
      description,
      date,
      startDate,
      endDate,
      time,
      venue,
      duration,
      capacity,
      registrationFormFields,
      dailyTimings,
      telegramLink
    } = req.body;
    const parsedTimings = parseDailyTimings(dailyTimings);
    const firstTiming = parsedTimings[0];

    if (!req.file) {
      return res.status(400).json({ message: 'Cover image is required' });
    }

    const coverImage = `/uploads/${req.file.filename}`;

    const workshop = new Workshop({
      title,
      description,
      coverImage,
      date: startDate || date,
      startDate: startDate || date,
      endDate: endDate || startDate || date,
      time: firstTiming?.startTime || time,
      dailyTimings: parsedTimings,
      telegramLink: telegramLink || '',
      venue,
      duration,
      capacity,
      registrationFormFields: parseRegistrationFormFields(registrationFormFields),
      createdBy: req.user.id
    });

    await workshop.save();
    res.status(201).json({ success: true, workshop });
  } catch (error) {
    // Clean up uploaded file if there's an error
    if (req.file) {
      const filePath = path.join(__dirname, '../uploads', req.file.filename);
      fs.unlink(filePath, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }
    res.status(500).json({ message: 'Error creating workshop', error: error.message });
  }
};

export const getAllWorkshops = async (req, res) => {
  try {
    const workshops = await Workshop.find({ isActive: true })
      .populate('createdBy', 'name email')
      .sort({ date: 1 });
    res.json(workshops);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching workshops', error: error.message });
  }
};

export const getWorkshopById = async (req, res) => {
  try {
    const workshop = await Workshop.findById(req.params.id)
      .populate('createdBy', 'name email');
    
    if (!workshop) {
      return res.status(404).json({ message: 'Workshop not found' });
    }
    
    res.json(workshop);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching workshop', error: error.message });
  }
};

export const updateWorkshop = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      date,
      startDate,
      endDate,
      time,
      venue,
      duration,
      capacity,
      registrationFormFields,
      dailyTimings,
      telegramLink
    } = req.body;
    const parsedTimings = parseDailyTimings(dailyTimings);
    const firstTiming = parsedTimings[0];

    const updateData = {
      title,
      description,
      date: startDate || date,
      startDate: startDate || date,
      endDate: endDate || startDate || date,
      time: firstTiming?.startTime || time,
      dailyTimings: parsedTimings,
      telegramLink: telegramLink || '',
      venue,
      duration,
      capacity,
      registrationFormFields: parseRegistrationFormFields(registrationFormFields),
      updatedAt: new Date()
    };

    if (req.file) {
      // Delete old image
      const workshop = await Workshop.findById(id);
      if (workshop && workshop.coverImage) {
        const oldPath = path.join(__dirname, '..', workshop.coverImage);
        fs.unlink(oldPath, (err) => {
          if (err) console.error('Error deleting old file:', err);
        });
      }
      updateData.coverImage = `/uploads/${req.file.filename}`;
    }

    const workshop = await Workshop.findByIdAndUpdate(id, updateData, { new: true })
      .populate('createdBy', 'name email');

    res.json({ success: true, workshop });
  } catch (error) {
    if (req.file) {
      const filePath = path.join(__dirname, '../uploads', req.file.filename);
      fs.unlink(filePath, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }
    res.status(500).json({ message: 'Error updating workshop', error: error.message });
  }
};

export const deleteWorkshop = async (req, res) => {
  try {
    const workshop = await Workshop.findByIdAndDelete(req.params.id);
    
    if (!workshop) {
      return res.status(404).json({ message: 'Workshop not found' });
    }

    // Delete cover image
    if (workshop.coverImage) {
      const imagePath = path.join(__dirname, '..', workshop.coverImage);
      fs.unlink(imagePath, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }

    // Delete registrations
    await Registration.deleteMany({ workshopId: workshop._id });

    res.json({ success: true, message: 'Workshop deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting workshop', error: error.message });
  }
};

export const getAdminWorkshops = async (req, res) => {
  try {
    const workshops = await Workshop.find({})
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(workshops);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching workshops', error: error.message });
  }
};

export const toggleWorkshopStatus = async (req, res) => {
  try {
    const workshop = await Workshop.findById(req.params.id);
    if (!workshop) {
      return res.status(404).json({ message: 'Workshop not found' });
    }

    workshop.isActive = !workshop.isActive;
    await workshop.save();

    res.json({ success: true, workshop });
  } catch (error) {
    res.status(500).json({ message: 'Error updating workshop status', error: error.message });
  }
};

export const toggleRegistrationStatus = async (req, res) => {
  try {
    const workshop = await Workshop.findById(req.params.id);
    if (!workshop) {
      return res.status(404).json({ message: 'Workshop not found' });
    }

    workshop.registrationsOpen = !workshop.registrationsOpen;
    await workshop.save();

    res.json({ success: true, workshop });
  } catch (error) {
    res.status(500).json({ message: 'Error updating registration status', error: error.message });
  }
};

export const toggleStoppedStatus = async (req, res) => {
  try {
    const workshop = await Workshop.findById(req.params.id);
    if (!workshop) {
      return res.status(404).json({ message: 'Workshop not found' });
    }

    workshop.isStopped = !workshop.isStopped;
    if (workshop.isStopped) {
      workshop.registrationsOpen = false;
    }
    await workshop.save();

    res.json({ success: true, workshop });
  } catch (error) {
    res.status(500).json({ message: 'Error updating workshop stop status', error: error.message });
  }
};
