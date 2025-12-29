'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Modal from '../components/Modal';
import { useAuthStore } from '../../store/authStore';
import { Pagination, Autoplay } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
// 수퍼베이스 클라이언트 임포트
import { supabase } from '@/utils/supabase';

const KOREAN_ONLY = /[^ㄱ-ㅎㅏ-ㅣ가-힣0-9\s.,!?]/g; // 한글, 숫자, 공백, 문장부호 제외 모두 제거
const ENGLISH_ONLY = /[^a-zA-Z0-9\s.,!?]/g; // 영어, 숫자, 공백, 문장부호 제외 모두 제거

const FanRadioPage = () => {
    const router = useRouter();
    // 현재 선택된 글로벌 언어 상태만 유지
    const lang = useAuthStore((state) => state.lang);

    const defaultBanners = [
        '“환영 메시지를 입력해주세요 💌\n보타스가 실제로 읽을 수도 있어요 👀”',
        '“언어 감지를 수동으로 진행하고 있습니다. 🛠️\n정확한 번역을 위해 선택하신 언어로만 작성해 주세요. 🥹”',
        '“TYPE YOUR WELCOME NOTE HERE 💌\nCOULD BE THE ONE BOTTAS ACTUALLY READS 👀”',
        '“Language detection is done manually. 🛠️\nFor smoother translation please write only in your selected language. 🥹”',
    ];

    const [bannerItems] = useState<string[]>(defaultBanners);
    const [message, setMessage] = useState('');
    const [language, setLanguage] = useState<'ko' | 'en'>('ko');
    const [modalOpen, setModalOpen] = useState(false);
    const [isLimitModalOpen, setLimitModalOpen] = useState(false);

    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [nextPath, setNextPath] = useState('');
    const confirmedNavigation = useRef(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const [showLangChangeModal, setShowLangChangeModal] = useState(false);
    const [pendingLang, setPendingLang] = useState<'ko' | 'en' | null>(null);

    /** 전송 진행 상태 & 서버 응답 저장 */
    const [isSubmitting, setIsSubmitting] = useState(false);
    // 수퍼베이스에서 리턴받은 데이터를 담기 위해 any 또는 적절한 타입 지정
    const [createdRadio, setCreatedRadio] = useState<any>(null);

    // URL 파라미터(editId, editText)로 수정 모드 진입 (데모용 기능 유지)
    useEffect(() => {
        if (!router.isReady) return;
        const { editId, editText } = router.query;
        if (editId) setEditingId(Number(editId));
        if (editText) setMessage(String(editText));
    }, [router.isReady, router.query]);

    /* 페이지 이탈 방지 로직 */
    useEffect(() => {
        const handleRouteChange = (url: string) => {
            if (message.length > 0 && !confirmedNavigation.current) {
                setShowLeaveModal(true);
                setNextPath(url);
                router.events.emit('routeChangeError');
                throw 'Route change cancelled';
            }
        };
        router.events.on('routeChangeStart', handleRouteChange);
        return () => {
            router.events.off('routeChangeStart', handleRouteChange);
        };
    }, [message, router.events]);

    const handleConfirmLeave = () => {
        confirmedNavigation.current = true;
        router.push(nextPath);
    };

    const handleCancelLeave = () => setShowLeaveModal(false);

    /*전송 핸들러: 수퍼베이스 연동 */
    const handleSend = async () => {
        if (!message.trim()) {
            alert('메시지를 입력해 주세요.');
            return;
        }
        if (isSubmitting) return;

        setIsSubmitting(true);

        try {
            let result;

            if (editingId) {
                result = await supabase
                    .from('radios')
                    .update({
                        message_ko: message.trim(), // 현재 입력된 내용으로 교체
                        message_en: message.trim(), // 영문 컬럼도 함께 교체
                    })
                    .eq('id', editingId)
                    .select();
            } else {
                result = await supabase
                    .from('radios')
                    .insert([
                        {
                            nickname: 'Guest',
                            message_ko: message.trim(),
                            message_en: message.trim(),
                            lang: language,
                            likes: 0,
                        },
                    ])
                    .select();
            }

            const { data, error } = result;

            if (error) throw error;

            if (data && data.length > 0) {
                setCreatedRadio(data[0]);
                setModalOpen(true);
            }
        } catch (e) {
            console.error('전송 실패:', e);
            alert('요청 처리에 실패했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // 모달의 Primary 버튼 (Show me) 클릭 시 마이페이지 이동
    const handleSuccessPrimaryClick = () => {
        setModalOpen(false);

        if (createdRadio) {
            const msg = language === 'ko' ? createdRadio.message_ko : createdRadio.message_en;

            setMessage('');
            confirmedNavigation.current = true;

            // 마이페이지로 이동하며 올바른 메시지 전달
            router.push(`/my-page?modal=fan-radio&message=${encodeURIComponent(msg)}`);
        }
    };

    const handleSuccessSecondaryClick = () => {
        setModalOpen(false);
        setMessage('');
    };

    return (
        <div className="w-full max-w-md mx-auto px-4 min-h-screen overflow-y-auto pt-[70px] pb-[80px]">
            <style jsx global>{`
                .fan-radio-pagination .swiper-pagination-bullet {
                    width: 5px;
                    height: 5px;
                    background-color: rgba(0, 210, 202, 0.5);
                    border-radius: 50%;
                    opacity: 1;
                    transition: background-color 0.3s;
                    margin: 0 3px !important;
                }
                .fan-radio-pagination .swiper-pagination-bullet-active {
                    background-color: #02f5d0;
                }
            `}</style>

            {/* 배너 영역 */}
            <div className="rounded-xl overflow-hidden shadow-lg">
                <Image
                    src="/images/fan-radio.svg"
                    alt="Main Fan"
                    width={340}
                    height={180}
                    className="w-full h-auto object-contain"
                />
                <div className="relative">
                    <Swiper
                        modules={[Pagination, Autoplay]}
                        loop={true}
                        pagination={{ clickable: true, el: '.fan-radio-pagination' }}
                        autoplay={{ delay: 3000, disableOnInteraction: false }}
                        className="w-full"
                    >
                        {bannerItems.map((text, idx) => (
                            <SwiperSlide key={idx}>
                                <div
                                    className="min-w-full h-[100px] sm:h-[120px] flex items-center justify-center px-4 py-3 text-center"
                                    style={{
                                        background:
                                            'linear-gradient(90deg, #00DDBC 0%, #009A94 35%, #009A94 49.52%, #009A94 65%, #00DDBC 100%)',
                                    }}
                                >
                                    <div className="whitespace-pre-wrap text-xs sm:text-sm text-[#02F5D0]">{text}</div>
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                    <div className="fan-radio-pagination absolute bottom-3 left-0 right-0 z-10 flex justify-center items-center" />
                </div>
            </div>

            {/* 작성 영역 */}
            <div className="relative w-full mt-6 sm:mt-8">
                <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-0.5 h-3.5 bg-[#02f5d0]" />
                    <span className="text-base sm:text-lg tracking-wide leading-5 text-white">Your Radio</span>
                </div>

                {/* 언어 선택 */}
                <div className="flex justify-end gap-4 mb-2">
                    {[
                        { code: 'ko', icon: '/icons/kr.svg', label: 'KR' },
                        { code: 'en', icon: '/icons/us.svg', label: 'EN' },
                    ].map(({ code, icon, label }) => (
                        <div
                            className="flex items-center gap-1.5 cursor-pointer"
                            key={code}
                            onClick={() => {
                                if (message.length > 0 && language !== code) {
                                    setPendingLang(code as 'ko' | 'en');
                                    setShowLangChangeModal(true);
                                } else {
                                    setLanguage(code as 'ko' | 'en');
                                    setMessage('');
                                }
                            }}
                        >
                            <Image src={icon} alt={label} width={20} height={15} />
                            <span className="text-xs text-gray-300">{label}</span>
                            <div className="w-[15px] h-[15px] rounded-full border-2 border-[#02f5d0] flex items-center justify-center">
                                {language === code && <div className="w-[7px] h-[7px] bg-[#02f5d0] rounded-full" />}
                            </div>
                        </div>
                    ))}
                </div>

                {/* 메시지 입력 박스 */}
                <div className="w-full h-[180px] sm:h-[210px] rounded-[15px] relative">
                    <textarea
                        className={`w-full h-full p-4 pr-14 bg-[#22202A] text-sm sm:text-base text-white resize-none rounded-[15px] ...`}
                        placeholder={language === 'ko' ? '한국어로 입력해주세요 😉' : 'Please type in English only 😉'}
                        value={message}
                        onChange={(e) => {
                            let val = e.target.value;

                            if (language === 'ko') {
                                // 한국어 모드인데 영어가 들어오면 제거
                                if (/[a-zA-Z]/.test(val)) {
                                    alert('한국어 모드에서는 한국어만 입력 가능합니다.');
                                    val = val.replace(/[a-zA-Z]/g, '');
                                }
                            } else {
                                // 영어 모드인데 한글이 들어오면 제거
                                if (/[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(val)) {
                                    alert('English mode only allows English characters.');
                                    val = val.replace(/[ㄱ-ㅎㅏ-ㅣ가-힣]/g, '');
                                }
                            }

                            if (val.length <= 500) {
                                setMessage(val);
                            }
                        }}
                        maxLength={500}
                    />
                </div>

                {/* 전송 버튼 */}
                <div className="flex justify-center mt-4 sm:mt-6">
                    <button
                        onClick={handleSend}
                        disabled={isSubmitting}
                        className="w-full bg-[#02F5D0] text-[#383838] py-3 rounded-[15px] text-[15px] sm:text-base font-bold tracking-wide transition-opacity active:opacity-80 disabled:opacity-50"
                    >
                        {isSubmitting ? 'Sending...' : editingId ? 'Update Fan Radio 📻' : 'Send Fan Radio 📻'}
                    </button>
                </div>
            </div>

            {/* 모달들 */}
            <Modal
                isOpen={modalOpen}
                title={editingId ? 'Fan Radio updated' : 'Fan Radio sent'}
                message={createdRadio ? `#${createdRadio.id} by ${createdRadio.nickname}` : 'Success! ✨'}
                primaryText="Show me"
                secondaryText="Close"
                icon={<span>🚀</span>}
                onPrimary={handleSuccessPrimaryClick}
                onSecondary={handleSuccessSecondaryClick}
            />

            <Modal
                isOpen={showLangChangeModal}
                title="Change language?"
                message="Switching will clear your current message. Proceed?"
                primaryText="Switch"
                secondaryText="Cancel"
                onPrimary={() => {
                    if (pendingLang) {
                        setLanguage(pendingLang);
                        setMessage('');
                    }
                    setShowLangChangeModal(false);
                }}
                onSecondary={() => setShowLangChangeModal(false)}
            />

            <Modal
                isOpen={showLeaveModal}
                title="Leave this page?"
                message="Your draft will vanish if you go 👀"
                primaryText="Go"
                secondaryText="Stay"
                onPrimary={handleConfirmLeave}
                onSecondary={handleCancelLeave}
            />
        </div>
    );
};

FanRadioPage.title = 'FAN RADIO';
export default FanRadioPage;
