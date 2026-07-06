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
            <span className='flex items-center gap-2 text-zinc-900 dark:text-zinc-100'>
                <Avatar name={suggestion} size='25' textSizeRatio={2} round={true} />
                {suggestion}
            </span>
        ),
        value: suggestion
    }));

    const externalValue = value.map((item) => ({ rawLabel: item.label, label: item.label, value: item.value }))
    const externalDefaultValue = defaultValues?.map((item) => ({ rawLabel: item.label, label: item.label, value: item.value }))

    return (
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-md flex items-center bg-transparent dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
            <span className='ml-3 text-sm text-zinc-500 dark:text-zinc-400 font-medium select-none'>{label}</span>
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
                        <span className='flex items-center gap-2 text-zinc-900 dark:text-zinc-100'>
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
                        return 'text-zinc-900 dark:text-zinc-100'
                    },
                    multiValue: () => {
                        return 'bg-zinc-100 dark:!bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded'
                    },
                    multiValueLabel: () => {
                        return 'text-zinc-800 dark:text-zinc-200 rounded-md'
                    },
                    multiValueRemove: () => {
                        return 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100'
                    },
                    indicatorsContainer: () => {
                        return 'bg-transparent dark:bg-transparent'
                    },
                    input: () => {
                        return 'text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 bg-transparent'
                    },
                    placeholder: () => {
                        return 'text-zinc-400 dark:text-zinc-500'
                    },
                    menu: () => {
                        return 'bg-white dark:!bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-md rounded-md mt-1'
                    },
                    option: ({ isFocused }) => {
                        return isFocused 
                            ? 'bg-zinc-100 dark:bg-zinc-800 p-2 cursor-pointer' 
                            : 'bg-transparent p-2 cursor-pointer'
                    }
                }}
                classNamePrefix="select"
            />
        </div>
    );
};

export default TagInput;