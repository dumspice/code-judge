'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CreateClassroomModalProps {
    open: boolean;
    onClose: () => void;
}

export function CreateClassroomModal({
    open,
    onClose,
}: CreateClassroomModalProps) {
    const [name, setName] = useState('');
    const [description, setDescription] =
        useState('');
    const [academicYear, setAcademicYear] =
        useState('');

    const [isSubmitting, setIsSubmitting] =
        useState(false);

    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [open]);

    if (!open) return null;

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true);

            const payload = {
                name,
                description,
                academicYear,
            };

            console.log(payload);

            await new Promise((resolve) =>
                setTimeout(resolve, 1000),
            );

            setName('');
            setDescription('');
            setAcademicYear('');

            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 p-1 rounded-full hover:bg-gray-100 cursor-pointer"
                >
                    <X className="w-5 h-5 text-gray-500" />
                </button>

                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">
                        Create Classroom
                    </h2>

                    <p className="text-sm text-gray-500 mt-1">
                        Create a new classroom for your
                        students.
                    </p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Classroom Name
                        </label>

                        <input
                            type="text"
                            value={name}
                            onChange={(e) =>
                                setName(e.target.value)
                            }
                            placeholder="Backend Engineering"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-black"
                            maxLength={100}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>

                        <textarea
                            value={description}
                            onChange={(e) =>
                                setDescription(e.target.value)
                            }
                            placeholder="Describe your classroom..."
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-black resize-none"
                            rows={4}
                            maxLength={1000}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Academic Year
                        </label>

                        <input
                            type="text"
                            value={academicYear}
                            onChange={(e) =>
                                setAcademicYear(
                                    e.target.value,
                                )
                            }
                            placeholder="2025-2026"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-black"
                            maxLength={30}
                        />
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 mt-6">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="cursor-pointer"
                    >
                        Cancel
                    </Button>

                    <Button
                        onClick={handleSubmit}
                        disabled={
                            isSubmitting ||
                            name.trim().length < 3
                        }
                        className="cursor-pointer"
                    >
                        {isSubmitting
                            ? 'Creating...'
                            : 'Create Classroom'}
                    </Button>
                </div>
            </div>
        </div>
    );
}