import React, { useState } from 'react';
import { FiTrash2, FiEdit2, FiPlus } from 'react-icons/fi';

export const FormBuilder = ({ initialFields = [], onFieldsChange }) => {
  const [fields, setFields] = useState(initialFields);
  const [newField, setNewField] = useState({
    label: '',
    type: 'text',
    required: true,
    options: [],
    correctAnswer: ''
  });

  const needsOptions = (type) => ['select', 'radio', 'checkbox', 'question-mcq'].includes(type);
  const optionLetters = ['A', 'B', 'C', 'D'];

  const fieldTypeLabel = (type) => ({
    text: 'Text',
    email: 'Email',
    phone: 'Phone',
    textarea: 'Textarea',
    select: 'Dropdown',
    radio: 'Radio Button',
    checkbox: 'Checkbox',
    'question-text': 'Question - Text Answer',
    'question-mcq': 'Question - ABCD Options'
  }[type] || type);

  const addField = () => {
    if (!newField.label) {
      alert('Please enter a field label');
      return;
    }

    const field = {
      fieldId: `field_${Date.now()}`,
      ...newField,
      order: fields.length
    };

    const updatedFields = [...fields, field];
    setFields(updatedFields);
    onFieldsChange(updatedFields);
    setNewField({
      label: '',
      type: 'text',
      required: true,
      options: [],
      correctAnswer: ''
    });
  };

  const removeField = (fieldId) => {
    const updatedFields = fields
      .filter(f => f.fieldId !== fieldId)
      .map((f, index) => ({ ...f, order: index }));
    setFields(updatedFields);
    onFieldsChange(updatedFields);
  };

  const updateField = (fieldId, updates) => {
    const updatedFields = fields.map(f =>
      f.fieldId === fieldId ? { ...f, ...updates } : f
    );
    setFields(updatedFields);
    onFieldsChange(updatedFields);
  };

  const moveField = (fieldId, direction) => {
    const index = fields.findIndex(f => f.fieldId === fieldId);
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === fields.length - 1)
    ) {
      return;
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const updatedFields = [...fields];
    [updatedFields[index], updatedFields[newIndex]] = [updatedFields[newIndex], updatedFields[index]];
    updatedFields.forEach((f, i) => f.order = i);
    setFields(updatedFields);
    onFieldsChange(updatedFields);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="font-bold text-lg mb-4">Registration Form Builder</h3>

      {/* Add New Field */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6 space-y-4">
        <h4 className="font-semibold">Add New Field</h4>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Field Label</label>
          <input
            type="text"
            value={newField.label}
            onChange={(e) => setNewField({ ...newField, label: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="e.g., Full Name, Email, etc."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Field Type</label>
            <select
              value={newField.type}
              onChange={(e) => {
                const type = e.target.value;
                setNewField({
                  ...newField,
                  type,
                  options: type === 'question-mcq' ? ['A', 'B', 'C', 'D'] : needsOptions(type) ? newField.options : [],
                  correctAnswer: ['question-text', 'question-mcq'].includes(type) ? newField.correctAnswer : ''
                });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="text">Text</option>
              <option value="email">Email</option>
              <option value="phone">Phone</option>
              <option value="textarea">Textarea</option>
              <option value="select">Dropdown</option>
              <option value="radio">Radio Button</option>
              <option value="checkbox">Checkbox</option>
              <option value="question-text">Question - Text Answer</option>
              <option value="question-mcq">Question - ABCD Options</option>
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex items-center space-x-2 mb-2">
              <input
                type="checkbox"
                checked={newField.required}
                onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium text-gray-700">Required</span>
            </label>
          </div>
        </div>

        {newField.type === 'question-mcq' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ABCD Options</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {optionLetters.map((letter, index) => (
                <label key={letter} className="rounded-lg border border-gray-200 bg-white p-3">
                  <span className="block text-xs font-bold text-secondary mb-1">Option {letter}</span>
                  <input
                    type="text"
                    value={newField.options[index] || ''}
                    onChange={(e) => {
                      const options = [...(newField.options.length ? newField.options : optionLetters)];
                      options[index] = e.target.value;
                      setNewField({ ...newField, options });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={`Answer ${letter}`}
                  />
                </label>
              ))}
            </div>
          </div>
        ) : needsOptions(newField.type) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Options (comma-separated)</label>
            <input
              type="text"
              value={newField.options.join(', ')}
              onChange={(e) =>
                setNewField({
                  ...newField,
                  options: e.target.value.split(',').map(o => o.trim()).filter(o => o)
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Option 1, Option 2, Option 3"
            />
          </div>
        )}

        {(newField.type === 'question-text' || newField.type === 'question-mcq') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Answer Key</label>
            {newField.type === 'question-mcq' ? (
              <div className="grid grid-cols-4 gap-2">
                {optionLetters.map((letter, index) => (
                  <button
                    key={letter}
                    type="button"
                    onClick={() => setNewField({ ...newField, correctAnswer: newField.options[index] || letter })}
                    className={`rounded-lg border px-3 py-2 text-sm font-bold transition ${
                      newField.correctAnswer === (newField.options[index] || letter)
                        ? 'border-secondary bg-secondary text-white'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-secondary'
                    }`}
                  >
                    {letter}
                  </button>
                ))}
              </div>
            ) : (
              <input
                type="text"
                value={newField.correctAnswer || ''}
                onChange={(e) => setNewField({ ...newField, correctAnswer: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Expected answer"
              />
            )}
          </div>
        )}

        <button
          type="button"
          onClick={addField}
          className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-medium flex items-center justify-center space-x-2"
        >
          <FiPlus /> <span>Add Field</span>
        </button>
      </div>

      {/* Existing Fields */}
      <div className="space-y-3">
        <h4 className="font-semibold">Form Fields ({fields.length})</h4>

        {fields.length === 0 ? (
          <p className="text-gray-500 text-center py-6">No fields added yet</p>
        ) : (
          fields.map((field, index) => (
            <div key={field.fieldId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
              <div className="flex-1">
                <p className="font-medium text-gray-900">{field.label}</p>
                <p className="text-sm text-gray-500">
                  {fieldTypeLabel(field.type)}
                  {field.required && ' (Required)'}
                  {field.correctAnswer && ` - Answer: ${field.correctAnswer}`}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => moveField(field.fieldId, 'up')}
                  disabled={index === 0}
                  className="px-2 py-1 text-sm bg-gray-200 hover:bg-gray-300 disabled:opacity-50 rounded"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveField(field.fieldId, 'down')}
                  disabled={index === fields.length - 1}
                  className="px-2 py-1 text-sm bg-gray-200 hover:bg-gray-300 disabled:opacity-50 rounded"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => removeField(field.fieldId)}
                  className="px-3 py-1 text-red-600 hover:bg-red-50 rounded transition"
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
