'use client';

import { useEffect, useState } from 'react';
import { X, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface JoinClassroomModalProps {
    open: boolean;
    onClose: () => void;
}

export function JoinClassroomModal({
    open,
    onClose,
}: JoinClassroomModalProps) {
    const [classCode, setClassCode] =
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

    const handleJoinClassroom = async () => {
        try {
            setIsSubmitting(true);

            const payload = {
                classCode: classCode.trim(),
            };

            console.log(payload);

            /**
             * TODO:
             * Replace with real API
             */

            await new Promise((resolve) =>
                setTimeout(resolve, 1000),
            );

            setClassCode('');

            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="relative px-6 py-5 border-b border-gray-100">
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 p-1 rounded-full hover:bg-gray-100 transition cursor-pointer"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>

                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-black flex items-center justify-center">
                            <Users className="w-5 h-5 text-white" />
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-gray-900">
                                Join Classroom
                            </h2>

                            <p className="text-sm text-gray-500">
                                Enter classroom code to join
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Classroom Code
                        </label>

                        <input
                            type="text"
                            value={classCode}
                            onChange={(e) =>
                                setClassCode(
                                    e.target.value.toUpperCase(),
                                )
                            }
                            placeholder="ABCD1234"
                            maxLength={12}
                            className="w-full h-12 rounded-xl border border-gray-300 px-4 text-center text-lg tracking-[0.25em] font-semibold uppercase outline-none focus:ring-2 focus:ring-black focus:border-black"
                        />

                        <p className="mt-2 text-xs text-gray-500">
                            Ask your teacher or classroom owner
                            for the invite code.
                        </p>
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
                            onClick={handleJoinClassroom}
                            disabled={
                                isSubmitting ||
                                classCode.trim().length < 6
                            }
                            className="cursor-pointer"
                        >
                            {isSubmitting
                                ? 'Joining...'
                                : 'Join Classroom'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}