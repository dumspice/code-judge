import { create } from 'zustand';
import { Classroom, getMyClassrooms } from '@/services/classroom.apis';

interface ClassroomState {
    teaching: Classroom[];
    enrolled: Classroom[];
    loading: boolean;

    fetchClassrooms: () => Promise<void>;
    addClassroom: (classroom: Classroom, role: 'OWNER' | 'MEMBER') => void;
    reset: () => void;
}

export const useClassroomStore = create<ClassroomState>((set, get) => ({
    teaching: [],
    enrolled: [],
    loading: false,

    fetchClassrooms: async () => {
        set({ loading: true });

        try {
            const data = await getMyClassrooms();

            set({
                teaching: data
                    .filter((item) => item.role === 'OWNER')
                    .map((item) => item.classRoom),

                enrolled: data
                    .filter((item) => item.role === 'MEMBER')
                    .map((item) => item.classRoom),

                loading: false,
            });
        } catch (error) {
            console.error(error);
            set({ loading: false });
        }
    },

    addClassroom: (classroom, role) => {
        const state = get();

        if (role === 'OWNER') {
            set({
                teaching: [classroom, ...state.teaching],
            });
        } else {
            set({
                enrolled: [classroom, ...state.enrolled],
            });
        }
    },

    reset: () => {
        set({
            teaching: [],
            enrolled: [],
        });
    },
}));