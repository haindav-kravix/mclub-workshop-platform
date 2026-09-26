import Registration from '../models/Registration.js';

const selectedStatement = (statement) => ({
  statementId: statement._id,
  title: statement.title,
  description: statement.description,
  selectedAt: new Date()
});

const publishedStatements = (workshop) => (
  (workshop.problemStatements || []).filter(statement => statement.isPublished)
);

const randomItem = (items) => items[Math.floor(Math.random() * items.length)];

const shuffle = (items) => {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
};

export const assignRandomStatementToRegistration = async (registration, workshop) => {
  if (!registration || workshop?.problemStatementAssignmentMode !== 'random') return false;
  if (registration.selectedProblemStatement?.statementId) return false;

  const statements = publishedStatements(workshop);
  if (!statements.length) return false;

  const statementIds = statements.map(statement => statement._id);
  const counts = await Registration.aggregate([
    {
      $match: {
        workshopId: registration.workshopId,
        status: 'confirmed',
        'selectedProblemStatement.statementId': { $in: statementIds }
      }
    },
    { $group: { _id: '$selectedProblemStatement.statementId', count: { $sum: 1 } } }
  ]);
  const countById = new Map(counts.map(item => [String(item._id), item.count]));
  const minimum = Math.min(...statements.map(statement => countById.get(String(statement._id)) || 0));
  const candidates = statements.filter(statement => (countById.get(String(statement._id)) || 0) === minimum);
  registration.selectedProblemStatement = selectedStatement(randomItem(candidates));
  return true;
};

export const assignRandomStatementsToConfirmedTeams = async (workshop, { resetExisting = false } = {}) => {
  if (workshop?.problemStatementAssignmentMode !== 'random') return { assignedCount: 0, pendingCount: 0 };

  const statements = publishedStatements(workshop);
  const validIds = new Set(statements.map(statement => String(statement._id)));
  const registrations = await Registration.find({ workshopId: workshop._id, status: 'confirmed' })
    .select('_id selectedProblemStatement')
    .lean();
  const counts = new Map(statements.map(statement => [String(statement._id), 0]));
  const pending = [];

  registrations.forEach((registration) => {
    const selectedId = String(registration.selectedProblemStatement?.statementId || '');
    if (!resetExisting && validIds.has(selectedId)) {
      counts.set(selectedId, (counts.get(selectedId) || 0) + 1);
      return;
    }
    pending.push(registration);
  });

  const operations = [];
  shuffle(pending).forEach((registration) => {
    if (!statements.length) {
      operations.push({
        updateOne: {
          filter: { _id: registration._id },
          update: { $unset: { selectedProblemStatement: 1 }, $set: { updatedAt: new Date() } }
        }
      });
      return;
    }

    const minimum = Math.min(...counts.values());
    const candidates = statements.filter(statement => counts.get(String(statement._id)) === minimum);
    const statement = randomItem(candidates);
    const statementId = String(statement._id);
    counts.set(statementId, counts.get(statementId) + 1);
    operations.push({
      updateOne: {
        filter: { _id: registration._id },
        update: { $set: { selectedProblemStatement: selectedStatement(statement), updatedAt: new Date() } }
      }
    });
  });

  if (operations.length) await Registration.bulkWrite(operations);
  return {
    assignedCount: statements.length ? operations.length : 0,
    pendingCount: statements.length ? 0 : pending.length
  };
};
