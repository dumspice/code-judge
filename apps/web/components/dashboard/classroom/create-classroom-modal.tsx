'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClassroom } from '@/services/classroom.apis';
import { useRouter } from 'next/navigation';


interface CreateClassroomModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function CreateClassroomModal({
    open,
    onClose,
    onSuccess,
}: CreateClassroomModalProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [academicYear, setAcademicYear] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const router = useRouter();

    useEffect(() => {
        document.body.style.overflow = open ? 'hidden' : '';
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

            const res = await createClassroom(payload);

            // update sidebar
            window.dispatchEvent(new Event('classroom:created'));

            // reset form
            setName('');
            setDescription('');
            setAcademicYear('');

            onClose();

            router.push(`/dashboard/${res.id}`);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
            <div className="relative w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl">

                <button
                    onClick={onClose}
                    className="absolute right-4 top-4"
                >
                    <X />
                </button>

                <h2 className="text-xl font-bold mb-4">
                    Create Classroom
                </h2>

                <input
                    className="w-full border p-2 rounded mb-3"
                    placeholder="Class name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />

                <textarea
                    className="w-full border p-2 rounded mb-3"
                    placeholder="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />

                <input
                    className="w-full border p-2 rounded mb-4"
                    placeholder="Academic Year"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                />

                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>

                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || name.length < 3}
                    >
                        {isSubmitting ? 'Creating...' : 'Create'}
                    </Button>
                </div>
            </div>
        </div>
    );
}