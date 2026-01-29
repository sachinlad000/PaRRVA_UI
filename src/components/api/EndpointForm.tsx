import { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import type { EndpointField, ParsedEndpoint } from '../../lib/postman/endpoints';

interface DynamicFieldProps {
    field: EndpointField;
    value: unknown;
    onChange: (value: unknown) => void;
}

function DynamicField({ field, value, onChange }: DynamicFieldProps) {
    const fieldValue = value ?? '';

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const newValue = field.type === 'number'
            ? (e.target.value === '' ? '' : Number(e.target.value))
            : e.target.value;
        onChange(newValue);
    };

    const inputClass = 'input text-sm';

    switch (field.type) {
        case 'number':
            return (
                <input
                    type="number"
                    value={fieldValue as string | number}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder={field.description || `Enter ${field.name}`}
                    step="any"
                />
            );

        case 'boolean':
            return (
                <select
                    value={String(fieldValue)}
                    onChange={handleChange}
                    className={inputClass}
                >
                    <option value="true">True</option>
                    <option value="false">False</option>
                </select>
            );

        case 'date':
            return (
                <input
                    type="date"
                    value={fieldValue as string}
                    onChange={handleChange}
                    className={inputClass}
                />
            );

        case 'datetime':
            return (
                <input
                    type="datetime-local"
                    value={(fieldValue as string).replace('Z', '').slice(0, 16)}
                    onChange={(e) => onChange(e.target.value ? `${e.target.value}:00.000Z` : '')}
                    className={inputClass}
                />
            );

        default:
            return (
                <input
                    type="text"
                    value={fieldValue as string}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder={field.description || `Enter ${field.name}`}
                />
            );
    }
}

interface FormItemProps {
    data: Record<string, unknown>;
    fields: EndpointField[];
    onChange: (data: Record<string, unknown>) => void;
    onRemove?: () => void;
    index?: number;
}

function FormItem({ data, fields, onChange, onRemove, index }: FormItemProps) {
    const [expanded, setExpanded] = useState(true);

    const handleFieldChange = (fieldName: string, value: unknown) => {
        onChange({ ...data, [fieldName]: value });
    };

    return (
        <div className="border border-border rounded-lg overflow-hidden mb-3">
            <div
                className="flex items-center justify-between px-4 py-2 bg-secondary/50 cursor-pointer"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center gap-2">
                    {expanded ? (
                        <ChevronDown className="w-4 h-4" />
                    ) : (
                        <ChevronRight className="w-4 h-4" />
                    )}
                    <span className="font-medium text-sm">
                        {index !== undefined ? `Item ${index + 1}` : 'Details'}
                    </span>
                </div>
                {onRemove && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemove();
                        }}
                        className="p-1 hover:bg-destructive/20 rounded text-destructive"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                )}
            </div>

            {expanded && (
                <div className="p-4 grid gap-4">
                    {fields.map((field) => (
                        <div key={field.name} className="grid gap-1.5">
                            <label className="text-sm font-medium flex items-center gap-2">
                                {formatFieldName(field.name)}
                                {field.required && <span className="text-destructive">*</span>}
                            </label>
                            <DynamicField
                                field={field}
                                value={data[field.name]}
                                onChange={(value) => handleFieldChange(field.name, value)}
                            />
                            {field.description && (
                                <p className="text-xs text-muted-foreground">{field.description}</p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function formatFieldName(name: string): string {
    return name
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase())
        .trim();
}

interface Props {
    endpoint: ParsedEndpoint;
    value: unknown;
    onChange: (value: unknown) => void;
}

export function EndpointForm({ endpoint, value, onChange }: Props) {
    const [items, setItems] = useState<Record<string, unknown>[]>([]);

    // Initialize from value
    useEffect(() => {
        try {
            if (Array.isArray(value)) {
                setItems(value as Record<string, unknown>[]);
            } else if (typeof value === 'object' && value !== null) {
                setItems([value as Record<string, unknown>]);
            } else {
                // Try parsing from string
                const parsed = typeof value === 'string' ? JSON.parse(value) : [];
                setItems(Array.isArray(parsed) ? parsed : [parsed]);
            }
        } catch {
            setItems([createEmptyItem()]);
        }
    }, [endpoint.id]);

    // Sync changes back
    useEffect(() => {
        if (endpoint.payloadFormat === 'array') {
            onChange(items);
        } else {
            onChange(items[0] || {});
        }
    }, [items, endpoint.payloadFormat, onChange]);

    const createEmptyItem = (): Record<string, unknown> => {
        const item: Record<string, unknown> = {};
        endpoint.fields.forEach((field) => {
            switch (field.type) {
                case 'number':
                    item[field.name] = 0;
                    break;
                case 'boolean':
                    item[field.name] = false;
                    break;
                case 'date':
                case 'datetime':
                    item[field.name] = new Date().toISOString();
                    break;
                default:
                    item[field.name] = '';
            }
        });
        return item;
    };

    const addItem = () => {
        setItems([...items, createEmptyItem()]);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, data: Record<string, unknown>) => {
        const newItems = [...items];
        newItems[index] = data;
        setItems(newItems);
    };

    // If no fields defined, show message
    if (endpoint.fields.length === 0) {
        return (
            <div className="p-4 text-center text-muted-foreground">
                <p className="mb-2">No form schema available for this endpoint.</p>
                <p className="text-sm">Use the JSON editor tab to enter your payload.</p>
            </div>
        );
    }

    return (
        <div className="p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">
                    {endpoint.payloadFormat === 'array' ? 'Items' : 'Request Data'}
                </h3>
                {endpoint.payloadFormat === 'array' && (
                    <button onClick={addItem} className="btn-secondary btn-sm">
                        <Plus className="w-3 h-3 mr-1" />
                        Add Item
                    </button>
                )}
            </div>

            <div className="max-h-[400px] overflow-y-auto scrollbar-thin">
                {items.map((item, index) => (
                    <FormItem
                        key={index}
                        data={item}
                        fields={endpoint.fields}
                        onChange={(data) => updateItem(index, data)}
                        onRemove={endpoint.payloadFormat === 'array' && items.length > 1
                            ? () => removeItem(index)
                            : undefined}
                        index={endpoint.payloadFormat === 'array' ? index : undefined}
                    />
                ))}

                {items.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                        <p>No items added yet.</p>
                        <button onClick={addItem} className="btn-primary btn-sm mt-4">
                            <Plus className="w-3 h-3 mr-1" />
                            Add First Item
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
