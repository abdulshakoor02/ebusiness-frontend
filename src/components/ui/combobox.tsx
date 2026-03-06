"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export interface ComboboxOption {
    value: string;
    label: string;
}

interface ComboboxProps {
    options: ComboboxOption[];
    value?: string;
    onValueChange: (value: string | undefined) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyText?: string;
    disabled?: boolean;
}

export function Combobox({
    options,
    value,
    onValueChange,
    placeholder = "Select option",
    searchPlaceholder = "Search...",
    emptyText = "No results found",
    disabled = false,
}: ComboboxProps) {
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState("");

    const filteredOptions = React.useMemo(() => {
        if (!search) return options;
        return options.filter((option) =>
            option.label.toLowerCase().includes(search.toLowerCase())
        );
    }, [options, search]);

    const selectedOption = options.find((opt) => opt.value === value);

    const handleSelect = (optionValue: string) => {
        onValueChange(optionValue === value ? undefined : optionValue);
        setOpen(false);
        setSearch("");
    };

    return (
        <>
            <Button
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between"
                onClick={() => !disabled && setOpen(true)}
                disabled={disabled}
            >
                {selectedOption ? selectedOption.label : placeholder}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>{placeholder}</DialogTitle>
                        <DialogDescription>
                            Search and select an option
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <Input
                            placeholder={searchPlaceholder}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full"
                            autoFocus
                        />
                        <div className="max-h-[300px] overflow-y-auto space-y-1">
                            {filteredOptions.length === 0 ? (
                                <p className="text-sm text-zinc-500 text-center py-4">{emptyText}</p>
                            ) : (
                                filteredOptions.map((option) => (
                                    <div
                                        key={option.value}
                                        onClick={() => handleSelect(option.value)}
                                        className={`
                                            flex items-center justify-between px-3 py-2 rounded-md cursor-pointer text-sm
                                            ${
                                                option.value === value
                                                    ? "bg-zinc-100 dark:bg-zinc-800"
                                                    : "hover:bg-zinc-50 dark:hover:bg-zinc-900"
                                            }
                                        `}
                                    >
                                        <span>{option.label}</span>
                                        {option.value === value && (
                                            <Check className="h-4 w-4" />
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
