import React, { useState } from 'react';
import { FiCheck, FiEdit3, FiPlus, FiTrash2, FiX } from 'react-icons/fi';

export const FormBuilder = ({ initialFields = [], onFieldsChange }) => {
  const [fields, setFields] = useState(initialFields);
  const [newField, setNewField] = useState({
    label: '',
    type: 'text',
    required: true,
    options: [],
    correctAnswer: ''
  });
  const [editingFieldId, setEditingFieldId] = useState(null);

  const needsOptions = (type) => ['select', 'radio', 'checkbox', 'question-mcq'].includes(type);
  const getOptionLabel = (index) => {
    let label = '';
    let number = index;
    do {
      label = String.fromCharCode(65 + (number % 26)) + label;
      number = Math.floor(number / 26) - 1;
    } while (number >= 0);
    return label;
  };
  const emptyOptions = (count = 4) => Array.from({ length: count }, () => '');

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

  const resetBuilder = () => {
    setNewField({
      label: '',
      type: 'text',
      required: true,
      options: [],
      correctAnswer: ''
    });
    setEditingFieldId(null);
  };

  const validateFieldDraft = () => {
    if (!newField.label.trim()) {
      alert('Please enter a field label');
      return null;
    }

    const cleanedOptions = needsOptions(newField.type)
      ? (newField.options.length ? newField.options : emptyOptions()).map(option => option.trim()).filter(Boolean)
      : [];

    if (needsOptions(newField.type) && cleanedOptions.length < 2) {
      alert('Please enter at least two options');
      return null;
    }

    if (newField.type === 'question-mcq' && (!newField.correctAnswer || !cleanedOptions.includes(newField.correctAnswer))) {
      alert('Please select the correct answer');
      return null;
    }

    return {
      ...newField,
      label: newField.label.trim(),
      options: cleanedOptions,
      correctAnswer: ['question-text', 'question-mcq'].includes(newField.type) ? newField.correctAnswer : ''
    };
  };

  const addField = () => {
    const validField = validateFieldDraft();
    if (!validField) return;

    const field = {
      fieldId: `field_${Date.now()}`,
      ...validField,
      order: fields.length
    };

    const updatedFields = [...fields, field];
    setFields(updatedFields);
    onFieldsChange(updatedFields);
    resetBuilder();
  };

  const startEditField = (field) => {
    setEditingFieldId(field.fieldId);
    setNewField({
      label: field.label || '',
      type: field.type || 'text',
      required: field.required !== false,
      options: needsOptions(field.type) ? (field.options?.length ? field.options : emptyOptions()) : [],
      correctAnswer: field.correctAnswer || ''
    });
  };

  const saveEditedField = () => {
    const validField = validateFieldDraft();
    if (!validField) return;

    const updatedFields = fields.map(field =>
      field.fieldId === editingFieldId ? { ...field, ...validField } : field
    );
    setFields(updatedFields);
    onFieldsChange(updatedFields);
    resetBuilder();
  };

  const removeField = (fieldId) => {
    const updatedFields = fields
      .filter(f => f.fieldId !== fieldId)
      .map((f, index) => ({ ...f, order: index }));
    setFields(updatedFields);
    onFieldsChange(updatedFields);
    if (editingFieldId === fieldId) {
      resetBuilder();
    }
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
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h4 className="font-semibold">{editingFieldId ? 'Edit Field' : 'Add New Field'}</h4>
          {editingFieldId && (
            <button
              type="button"
              onClick={resetBuilder}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-bold text-gray-700 transition hover:border-rose-300 hover:text-rose-700"
            >
              <FiX /> Cancel Edit
            </button>
          )}
        </div>

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
                  options: needsOptions(type) ? (newField.options.length ? newField.options : emptyOptions()) : [],
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

        {needsOptions(newField.type) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(newField.options.length ? newField.options : emptyOptions()).map((option, index) => {
                const label = getOptionLabel(index);
                return (
                <label key={`${label}-${index}`} className="rounded-lg border border-gray-200 bg-white p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="block text-xs font-bold text-secondary">Option {label}</span>
                    {newField.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => {
                          const optionToRemove = newField.options[index];
                          const options = newField.options.filter((_, optionIndex) => optionIndex !== index);
                          setNewField({
                            ...newField,
                            options,
                            correctAnswer: newField.correctAnswer === optionToRemove ? '' : newField.correctAnswer
                          });
                        }}
                        className="rounded-md bg-rose-50 px-2 py-1 text-xs font-bold text-rose-700 hover:bg-rose-100"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={option || ''}
                    onChange={(e) => {
                      const options = [...(newField.options.length ? newField.options : emptyOptions())];
                      const previousValue = options[index];
                      options[index] = e.target.value;
                      setNewField({
                        ...newField,
                        options,
                        correctAnswer: newField.type === 'question-mcq' && newField.correctAnswer === previousValue
                          ? e.target.value
                          : newField.correctAnswer
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={`Option ${label}`}
                  />
                </label>
              );
              })}
            </div>
            <button
              type="button"
              onClick={() => setNewField({
                ...newField,
                options: [...(newField.options.length ? newField.options : emptyOptions()), '']
              })}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-emerald-500 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800 shadow-sm transition hover:bg-emerald-100"
            >
              <FiPlus /> Add Another Option
            </button>
          </div>
        )}

        {(newField.type === 'question-text' || newField.type === 'question-mcq') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Answer Key</label>
            {newField.type === 'question-mcq' ? (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {newField.options.map((option, index) => {
                  const label = getOptionLabel(index);
                  return (
                  <button
                    key={`${label}-${index}`}
                    type="button"
                    onClick={() => option && setNewField({ ...newField, correctAnswer: option })}
                    disabled={!option}
                    className={`rounded-lg border px-3 py-2 text-sm font-bold transition ${
                      newField.correctAnswer === option
                        ? 'border-secondary bg-secondary text-white'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-secondary disabled:cursor-not-allowed disabled:opacity-40'
                    }`}
                  >
                    {label}
                  </button>
                );
                })}
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
          onClick={editingFieldId ? saveEditedField : addField}
          className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-medium flex items-center justify-center space-x-2"
        >
          {editingFieldId ? <FiCheck /> : <FiPlus />}
          <span>{editingFieldId ? 'Save Field Changes' : 'Add Field'}</span>
        </button>
      </div>

      {/* Existing Fields */}
      <div className="space-y-3">
        <h4 className="font-semibold">Form Fields ({fields.length})</h4>

        {fields.length === 0 ? (
          <p className="text-gray-500 text-center py-6">No fields added yet</p>
        ) : (
          fields.map((field, index) => (
            <div key={field.fieldId} className={`flex flex-col gap-3 rounded-lg p-3 transition sm:flex-row sm:items-center sm:justify-between ${
              editingFieldId === field.fieldId ? 'bg-emerald-50 ring-2 ring-emerald-200' : 'bg-gray-50 hover:bg-gray-100'
            }`}>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900">{field.label}</p>
                <p className="text-sm text-gray-500">
                  {fieldTypeLabel(field.type)}
                  {field.required && ' (Required)'}
                  {field.correctAnswer && ` - Answer: ${field.correctAnswer}`}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => startEditField(field)}
                  className="inline-flex items-center justify-center gap-1 rounded-lg bg-white px-3 py-2 text-sm font-bold text-secondary ring-1 ring-emerald-200 transition hover:bg-emerald-50"
                >
                  <FiEdit3 /> Edit
                </button>
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
