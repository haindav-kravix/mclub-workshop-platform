import React, { useState } from 'react';
import { FiTrash2, FiEdit2, FiPlus } from 'react-icons/fi';

export const FormBuilder = ({ initialFields = [], onFieldsChange }) => {
  const [fields, setFields] = useState(initialFields);
  const [newField, setNewField] = useState({
    label: '',
    type: 'text',
    required: true,
    options: []
  });

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
      options: []
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
              onChange={(e) => setNewField({ ...newField, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="text">Text</option>
              <option value="email">Email</option>
              <option value="phone">Phone</option>
              <option value="textarea">Textarea</option>
              <option value="select">Dropdown</option>
              <option value="radio">Radio Button</option>
              <option value="checkbox">Checkbox</option>
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

        {(newField.type === 'select' || newField.type === 'radio' || newField.type === 'checkbox') && (
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
                  {field.type.charAt(0).toUpperCase() + field.type.slice(1)}
                  {field.required && ' (Required)'}
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
