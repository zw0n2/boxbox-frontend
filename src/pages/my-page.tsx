'use client';

import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Image from 'next/image';

import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import MyPageModal from '@/components/MyPageModal';
import Modal from '@/components/Modal';

//  수퍼베이스 클라이언트 임포트
import { supabase } from '@/utils/supabase';
import { useAuthStore } from '../../store/authStore';

interface FanMessage {
    id: number;
    number: string;
    text: string;
}

// 로그인을 없애고 마이페이지에서 보여줄 고정 닉네임
const GUEST_NICKNAME = 'Guest';

const MyPage = () => {
    const router = useRouter();
    const { modal } = router.query;
    const lang = useAuthStore((state) => state.lang);

    const [isFanRadioModalOpen, setIsFanRadioModalOpen] = useState(false);
    const [character, setCharacter] = useState<'female' | 'male'>('female');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingMessageId, setDeletingMessageId] = useState<number | null>(null);

    const [myMessages, setMyMessages] = useState<FanMessage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // fetchMyRadioList 내부의 매핑 로직 수정
    useEffect(() => {
        const fetchMyRadioList = async () => {
            setIsLoading(true);
            try {
                const { data, error: sbError } = await supabase
                    .from('radios')
                    .select('*')
                    .eq('nickname', GUEST_NICKNAME)
                    .order('created_at', { ascending: false });

                if (data) {
                    const formattedMessages: FanMessage[] = data.map((item) => ({
                        id: item.id,
                        number: `#${String(item.id).padStart(2, '0')}`,
                        text: lang === 'ko' ? item.message_ko || item.message_en : item.message_en || item.message_ko,
                    }));
                    setMyMessages(formattedMessages);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchMyRadioList();
    }, [lang]); // lang이 변경될 때마다 텍스트가 스위칭됨

    useEffect(() => {
        if (modal === 'fan-radio') {
            setIsFanRadioModalOpen(true);
        }
    }, [modal]);

    const handleDeleteRequest = (id: number) => {
        setDeletingMessageId(id);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (deletingMessageId === null) return;

        try {
            const { error: sbError } = await supabase.from('radios').delete().eq('id', deletingMessageId);

            if (sbError) throw sbError;

            // 로컬 상태 업데이트
            setMyMessages((currentMessages) => currentMessages.filter((message) => message.id !== deletingMessageId));
            console.log(`${deletingMessageId}번 메시지가 삭제되었습니다.`);
        } catch (err) {
            console.error('Delete error:', err);
            alert('메시지 삭제에 실패했습니다.');
        } finally {
            setIsDeleteModalOpen(false);
            setDeletingMessageId(null);
        }
    };

    if (isLoading) {
        return <div className="min-h-screen bg-[#191922] text-white flex justify-center items-center">Loading...</div>;
    }

    if (error) {
        return <div className="min-h-screen bg-[#191922] text-red-500 flex justify-center items-center">{error}</div>;
    }

    return (
        <div className="min-h-screen bg-[#191922]">
            <Header title="MYPAGE" />

            <div className="relative w-full max-w-md mx-auto">
                <div className="absolute inset-0 z-0 bg-[url('/images/mypage-bg.svg')] bg-center bg-no-repeat" />

                <div className="relative z-10 flex flex-col min-h-screen justify-center pt-16 pb-24">
                    <main className="flex-1 flex flex-col items-center justify-center text-center">
                        <button onClick={() => setCharacter((prev) => (prev === 'female' ? 'male' : 'female'))}>
                            <Image
                                src={`/icons/petronas-${character}.svg`}
                                alt={`${character} character`}
                                width={250}
                                height={370}
                                className="mb-4"
                            />
                        </button>

                        <h2 className="font-bold text-3xl text-[#02F5D0]">{GUEST_NICKNAME}</h2>
                    </main>
                    <button
                        onClick={() => setIsFanRadioModalOpen(true)}
                        className="absolute bottom-24 right-4 sm:right-10 w-16 h-16 z-20"
                    >
                        <Image src="/icons/radio-btn.svg" alt="Open Radio Modal" layout="fill" />
                    </button>
                </div>
            </div>

            <BottomNav />

            <MyPageModal
                isOpen={isFanRadioModalOpen}
                nickname={GUEST_NICKNAME}
                messages={myMessages}
                onClose={() => {
                    setIsFanRadioModalOpen(false);
                    router.replace('/my-page', undefined, { shallow: true });
                }}
                onDelete={handleDeleteRequest}
            />

            <Modal
                isOpen={isDeleteModalOpen}
                title="Delete Message?"
                message="Are you sure you want to delete this radio message permanently?"
                primaryText="Delete"
                secondaryText="Cancel"
                onPrimary={handleConfirmDelete}
                onSecondary={() => {
                    setIsDeleteModalOpen(false);
                    setDeletingMessageId(null);
                }}
            />
        </div>
    );
};

MyPage.hideLayout = true;
export default MyPage;
