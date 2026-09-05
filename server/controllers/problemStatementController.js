import mongoose from 'mongoose';
import Workshop from '../models/Workshop.js';
import Registration from '../models/Registration.js';

const getHackathon = async (workshopId, select = 'title eventType problemStatements') => {
  if (!mongoose.Types.ObjectId.isValid(workshopId)) return null;
  return Workshop.findById(workshopId).select(select);
};

export const getAdminProblemStatements = async (req, res) => {
  try {
    const workshop = await getHackathon(req.params.id);
    if (!workshop) return res.status(404).json({ message: 'Hackathon not found' });
    if (workshop.eventType !== 'hackathon') return res.status(400).json({ message: 'Problem statements are available only for hackathons' });

    res.json({ workshopId: workshop._id, title: workshop.title, problemStatements: workshop.problemStatements });
  } catch (error) {
    res.status(500).json({ message: 'Unable to load problem statements', error: error.message });
  }
};

export const getProblemStatementSelections = async (req, res) => {
  try {
    const { id: workshopId } = req.params;
    const workshop = await getHackathon(workshopId, 'title eventType problemStatements');
    if (!workshop) return res.status(404).json({ message: 'Hackathon not found' });
    if (workshop.eventType !== 'hackathon') return res.status(400).json({ message: 'Problem statements are available only for hackathons' });

    const registrations = await Registration.find({ workshopId, status: 'confirmed' })
      .select('teamCode selectedProblemStatement createdAt')
      .sort({ createdAt: 1 })
      .lean();

    const selectionsByStatement = new Map();
    const pendingTeams = [];

    registrations.forEach((registration) => {
      const team = {
        registrationId: registration._id,
        teamName: registration.teamCode || 'Confirmed team',
        selectedAt: registration.selectedProblemStatement?.selectedAt || null
      };
      const statementId = registration.selectedProblemStatement?.statementId?.toString();
      if (!statementId) {
        pendingTeams.push(team);
        return;
      }

      if (!selectionsByStatement.has(statementId)) selectionsByStatement.set(statementId, []);
      selectionsByStatement.get(statementId).push(team);
    });

    const problemStatements = workshop.problemStatements.map((statement) => {
      const teams = selectionsByStatement.get(statement._id.toString()) || [];
      selectionsByStatement.delete(statement._id.toString());
      return {
        _id: statement._id,
        title: statement.title,
        isPublished: statement.isPublished,
        selectedCount: teams.length,
        teams
      };
    });

    selectionsByStatement.forEach((teams, statementId) => {
      const registration = registrations.find(item => item.selectedProblemStatement?.statementId?.toString() === statementId);
      problemStatements.push({
        _id: statementId,
        title: registration?.selectedProblemStatement?.title || 'Deleted problem statement',
        isPublished: false,
        isDeleted: true,
        selectedCount: teams.length,
        teams
      });
    });

    const selectedCount = registrations.length - pendingTeams.length;
    res.json({
      workshop: { _id: workshop._id, title: workshop.title },
      summary: {
        confirmedTeams: registrations.length,
        selectedTeams: selectedCount,
        pendingTeams: pendingTeams.length
      },
      problemStatements,
      pendingTeams
    });
  } catch (error) {
    res.status(500).json({ message: 'Unable to load problem statement selections', error: error.message });
  }
};

export const createProblemStatement = async (req, res) => {
  try {
    const title = String(req.body.title || '').trim();
    const description = String(req.body.description || '').trim();
    if (!title || !description) return res.status(400).json({ message: 'Title and problem statement are required' });

    const workshop = await getHackathon(req.params.id);
    if (!workshop) return res.status(404).json({ message: 'Hackathon not found' });
    if (workshop.eventType !== 'hackathon') return res.status(400).json({ message: 'Problem statements are available only for hackathons' });

    workshop.problemStatements.push({ title, description, createdBy: req.user.id });
    workshop.updatedAt = new Date();
    await workshop.save();
    res.status(201).json({ success: true, problemStatement: workshop.problemStatements.at(-1) });
  } catch (error) {
    res.status(500).json({ message: 'Unable to create problem statement', error: error.message });
  }
};

export const setProblemStatementPublished = async (req, res) => {
  try {
    const workshop = await getHackathon(req.params.id);
    if (!workshop) return res.status(404).json({ message: 'Hackathon not found' });
    if (workshop.eventType !== 'hackathon') return res.status(400).json({ message: 'Problem statements are available only for hackathons' });

    const statement = workshop.problemStatements.id(req.params.statementId);
    if (!statement) return res.status(404).json({ message: 'Problem statement not found' });
    statement.isPublished = Boolean(req.body.isPublished);
    statement.updatedAt = new Date();
    workshop.updatedAt = new Date();
    await workshop.save();
    res.json({ success: true, problemStatement: statement });
  } catch (error) {
    res.status(500).json({ message: 'Unable to update problem statement', error: error.message });
  }
};

export const deleteProblemStatement = async (req, res) => {
  try {
    const workshop = await getHackathon(req.params.id);
    if (!workshop) return res.status(404).json({ message: 'Hackathon not found' });
    if (workshop.eventType !== 'hackathon') return res.status(400).json({ message: 'Problem statements are available only for hackathons' });

    const statement = workshop.problemStatements.id(req.params.statementId);
    if (!statement) return res.status(404).json({ message: 'Problem statement not found' });
    statement.deleteOne();
    workshop.updatedAt = new Date();
    await workshop.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Unable to delete problem statement', error: error.message });
  }
};

export const getTeamProblemStatements = async (req, res) => {
  try {
    const { workshopId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(workshopId)) return res.status(400).json({ message: 'Invalid hackathon id' });
    const [workshop, registration] = await Promise.all([
      getHackathon(workshopId, 'title eventType problemStatements'),
      Registration.findOne({ workshopId, userId: req.user.id, status: 'confirmed' })
        .select('teamCode selectedProblemStatement')
        .lean()
    ]);
    if (!workshop) return res.status(404).json({ message: 'Hackathon not found' });
    if (workshop.eventType !== 'hackathon') return res.status(400).json({ message: 'Problem statements are available only for hackathons' });
    if (!registration) return res.status(403).json({ message: 'Only confirmed teams can select a problem statement' });

    const problemStatements = workshop.problemStatements
      .filter(statement => statement.isPublished)
      .map(statement => ({ _id: statement._id, title: statement.title, description: statement.description }));
    res.json({
      workshop: { _id: workshop._id, title: workshop.title },
      teamCode: registration.teamCode,
      selectedProblemStatement: registration.selectedProblemStatement?.statementId ? registration.selectedProblemStatement : null,
      problemStatements
    });
  } catch (error) {
    res.status(500).json({ message: 'Unable to load problem statements', error: error.message });
  }
};

export const selectProblemStatement = async (req, res) => {
  try {
    const { workshopId } = req.params;
    const { statementId } = req.body;
    if (!mongoose.Types.ObjectId.isValid(workshopId)) return res.status(400).json({ message: 'Invalid hackathon id' });
    if (!mongoose.Types.ObjectId.isValid(statementId)) return res.status(400).json({ message: 'Select a valid problem statement' });

    const workshop = await getHackathon(workshopId, 'eventType problemStatements');
    if (!workshop) return res.status(404).json({ message: 'Hackathon not found' });
    if (workshop.eventType !== 'hackathon') return res.status(400).json({ message: 'Problem statements are available only for hackathons' });
    const statement = workshop.problemStatements.id(statementId);
    if (!statement || !statement.isPublished) return res.status(404).json({ message: 'This problem statement is not available' });

    const selectedProblemStatement = {
      statementId: statement._id,
      title: statement.title,
      description: statement.description,
      selectedAt: new Date()
    };
    const registration = await Registration.findOneAndUpdate(
      {
        workshopId,
        userId: req.user.id,
        status: 'confirmed',
        $or: [
          { 'selectedProblemStatement.statementId': { $exists: false } },
          { 'selectedProblemStatement.statementId': null }
        ]
      },
      { $set: { selectedProblemStatement, updatedAt: new Date() } },
      { new: true }
    ).select('teamCode selectedProblemStatement');

    if (!registration) {
      const existing = await Registration.findOne({ workshopId, userId: req.user.id }).select('status selectedProblemStatement').lean();
      if (!existing || existing.status !== 'confirmed') return res.status(403).json({ message: 'Only confirmed teams can select a problem statement' });
      return res.status(409).json({ message: 'Your team has already selected a problem statement', selectedProblemStatement: existing.selectedProblemStatement });
    }

    res.json({ success: true, selectedProblemStatement: registration.selectedProblemStatement });
  } catch (error) {
    res.status(500).json({ message: 'Unable to select problem statement', error: error.message });
  }
};
