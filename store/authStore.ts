'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/** 유저/토큰 타입 */
export type User = {
    email: string;
    userNickname?: string;
    gender?: number;
};

type State = {
    user: User | null;
    accessToken: string | null;
    lang: 'ko' | 'en';

    /** 액션 */
    setUser: (u: User | null) => void;
    setAccessToken: (token: string | null) => void;
    setLang: (lang: State['lang']) => void;

    /** 로그인/로그아웃 헬퍼 */
    login: (params: { user: User; accessToken: string }) => void;
    logout: () => void;

    authHeader: () => Record<string, string>;
    isAuthed: () => boolean;
};

type UiState = {
    isLoggedIn: boolean;
    isLoginModalOpen: boolean;
    openLoginModal: () => void;
    closeLoginModal: () => void;
};

/**
 * 보안 원칙:
 * - accessToken은 "메모리"에만 보관(= persist 대상에서 제외)
 * - user, lang 등 민감하지 않은 값만 로컬/세션에 영속
 */
export const useAuthStore = create<State>()(
    persist(
        (set, get) => ({
            user: null,
            accessToken: null,
            lang: 'en',

            setUser: (u) => set({ user: u }),
            setAccessToken: (token) => set({ accessToken: token }),
            setLang: (lang) => set({ lang }),

            login: ({ user, accessToken }) => set({ user, accessToken }),
            logout: () => set({ user: null, accessToken: null }),

            authHeader: () => {
                const t = get().accessToken;
                const headers: Record<string, string> = {};
                if (t) headers.Authorization = `Bearer ${t}`;
                return headers;
            },

            isAuthed: () => !!get().user,
        }),
        {
            name: 'app-auth', // storage 키
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                user: state.user,
                lang: state.lang,
            }),
        }
    )
);

export const useUiStore = create<UiState>((set) => ({
    isLoggedIn: false,
    isLoginModalOpen: false,
    openLoginModal: () => set({ isLoginModalOpen: true }),
    closeLoginModal: () => set({ isLoginModalOpen: false }),
}));
