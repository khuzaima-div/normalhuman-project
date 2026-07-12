'use client'
import React, { useState } from 'react';
import Avatar from 'react-avatar';
import Select, { type GroupBase, type OnChangeValue } from 'react-select';

type TagValue = {
    label: string;
    value: string;
};

type TagOption = {
    rawLabel: string;
    label: React.ReactNode;
    value: string;
};

type TagInputProps = {
    suggestions: string[];
    defaultValues?: TagValue[];
    placeholder: string;
    label: string;
    minimal?: boolean;

    onChange: (values: TagValue[]) => void;
    value: TagValue[];
};

const TagInput: React.FC<TagInputProps> = ({ suggestions, defaultValues = [], label, placeholder, onChange, value, minimal }) => {
    const [input, setInput] = useState('');

    const options: TagOption[] = suggestions.map(suggestion => ({
        rawLabel: suggestion,
        label: (
            <span className='flex items-center gap-2 text-foreground'>
                <Avatar name={suggestion} size='25' textSizeRatio={2} round={true} />
                {suggestion}
            </span>
        ),
        value: suggestion
    }));

    const externalValue = value.map((item) => ({ rawLabel: item.label, label: item.label, value: item.value }))
    const externalDefaultValue = defaultValues?.map((item) => ({ rawLabel: item.label, label: item.label, value: item.value }))

    return (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-background text-foreground">
            <span className='ml-3 text-caption text-muted-foreground font-medium select-none'>{label}</span>
            <Select<TagOption, true, GroupBase<TagOption>>
                value={externalValue}
                onChange={(selected: OnChangeValue<TagOption, true>) => onChange(selected.map(option => ({ label: option.rawLabel, value: option.value })))}
                className='w-full flex-1'
                isMulti
                onInputChange={setInput}
                defaultValue={externalDefaultValue}
                placeholder={placeholder}
                options={input ? options.concat({
                    rawLabel: input,
                    label: (
                        <span className='flex items-center gap-2 text-foreground'>
                            <Avatar name={input} size='25' textSizeRatio={2} round={true} />
                            {input}
                        </span>
                    ), value: input
                }) : options}
                classNames={{
                    control: () => {
                        return '!border-none !outline-none !ring-0 !shadow-none focus:border-none focus:outline-none focus:ring-0 focus:shadow-none bg-transparent dark:bg-transparent'
                    },
                    valueContainer: () => {
                        return 'bg-transparent dark:bg-transparent'
                    },
                    singleValue: () => {
                        return 'text-foreground'
                    },
                    multiValue: () => {
                        return 'bg-muted border border-border rounded-md'
                    },
                    multiValueLabel: () => {
                        return 'text-foreground rounded-md'
                    },
                    multiValueRemove: () => {
                        return 'text-muted-foreground hover:text-foreground'
                    },
                    indicatorsContainer: () => {
                        return 'bg-transparent'
                    },
                    input: () => {
                        return 'text-foreground placeholder:text-muted-foreground bg-transparent'
                    },
                    placeholder: () => {
                        return 'text-muted-foreground'
                    },
                    menu: () => {
                        return 'bg-popover border border-border shadow-token-md rounded-lg mt-1'
                    },
                    option: ({ isFocused }) => {
                        return isFocused 
                            ? 'bg-accent p-2 cursor-pointer' 
                            : 'bg-transparent p-2 cursor-pointer'
                    }
                }}
                classNamePrefix="select"
            />
        </div>
    );
};
export default TagInput;
