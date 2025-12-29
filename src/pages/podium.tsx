'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import Dropdown from '@/components/Dropdown';
import PodiumModal from '@/components/PodiumModal';
import { useAuthStore, useUiStore } from '../../store/authStore';

import { supabase } from '@/utils/supabase';

// --- 인터페이스 정의 ---
interface User {
    id: number;
    nickname: string;
    likes: number;
    message: string;
    isLiked: boolean;
    rank?: number;
}

const PAGE_SIZE = 10; // 한 번에 불러올 데이터 개수

const PodiumPage = () => {
    const lang = useAuthStore((state) => state.lang);
    const isLoggedIn = useAuthStore((s) => s.isAuthed());
    const openLoginModal = useUiStore((s) => s.openLoginModal);

    const [isModalLoading, setIsModalLoading] = useState(false);
    const [filterType, setFilterType] = useState<'popular' | 'latest'>('popular');
    const [searchTerm, setSearchTerm] = useState('');
    const [inputValue, setInputValue] = useState('');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const [displayedUsers, setDisplayedUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 무한스크롤용 상태
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const loaderRef = useRef<HTMLDivElement | null>(null);

    const fetchData = async (reset = false) => {
        if (isLoading || (!hasMore && !reset)) return;

        setIsLoading(true);
        const currentPage = reset ? 0 : page;

        try {
            // 수퍼베이스 쿼리 빌더 시작
            let query = supabase.from('radios_with_rank').select('*');

            // 검색어 필터링 (닉네임에 검색어가 포함된 경우)
            if (searchTerm.trim() !== '') {
                query = query.ilike('nickname', `%${searchTerm}%`);
            }

            // 정렬 적용
            if (filterType === 'popular') {
                query = query.order('likes', { ascending: false });
            } else {
                query = query.order('created_at', { ascending: false });
            }

            // 페이지네이션 (범위 지정)
            const start = currentPage * PAGE_SIZE;
            const end = start + PAGE_SIZE - 1;
            const { data, error: sbError } = await query.range(start, end);

            if (sbError) throw sbError;

            if (data) {
                // 수퍼베이스 데이터를 User 인터페이스 형식으로 변환
                const formattedUsers: User[] = data.map((item) => ({
                    id: item.id,
                    nickname: item.nickname,
                    likes: item.likes || 0,
                    message:
                        lang === 'ko'
                            ? item.message_ko || item.message_en || item.message
                            : item.message_en || item.message_ko || item.message,
                    isLiked: false,
                    rank: item.global_rank,
                }));

                if (reset) {
                    setDisplayedUsers(formattedUsers);
                    setPage(1);
                    setHasMore(formattedUsers.length === PAGE_SIZE);
                } else {
                    setDisplayedUsers((prev) => [...prev, ...formattedUsers]);
                    setPage((prev) => prev + 1);
                    setHasMore(formattedUsers.length === PAGE_SIZE);
                }
            }
        } catch (err) {
            console.error(err);
            setError('데이터를 불러오는 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData(true);
    }, [searchTerm, filterType, lang]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !isLoading && hasMore) {
                    fetchData();
                }
            },
            { threshold: 0.5 }
        );

        if (loaderRef.current) observer.observe(loaderRef.current);
        return () => {
            if (loaderRef.current) observer.unobserve(loaderRef.current);
        };
    }, [isLoading, hasMore]);

    const popularRanks = useMemo(() => {
        const rankMap = new Map<number, number>();
        displayedUsers.forEach((user, index) => {
            rankMap.set(user.id, index);
        });
        return rankMap;
    }, [displayedUsers]);

    const handleLike = async (id: number) => {
        // if (!isLoggedIn) {
        //     openLoginModal();
        //     return;
        // }

        const target = displayedUsers.find((u) => u.id === id);
        if (!target) return;

        const nextIsLiked = !target.isLiked;
        const nextLikes = nextIsLiked ? target.likes + 1 : Math.max(0, target.likes - 1);

        setDisplayedUsers((prev) =>
            prev.map((u) => (u.id === id ? { ...u, isLiked: nextIsLiked, likes: nextLikes } : u))
        );
        if (selectedUser?.id === id) {
            setSelectedUser((prev) => (prev ? { ...prev, isLiked: nextIsLiked, likes: nextLikes } : null));
        }

        try {
            // 수퍼베이스 DB 업데이트
            const { error: updateError } = await supabase.from('radios').update({ likes: nextLikes }).eq('id', id);

            if (updateError) throw updateError;
        } catch (err) {
            console.error('좋아요 업데이트 실패:', err);
        }
    };

    const handleItemClick = (userFromList: User, currentRank: number) => {
        setSelectedUser({ ...userFromList, rank: currentRank });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            setSearchTerm(inputValue);
        }
    };

    const filterOptions = [
        { value: 'popular', label: 'Popular' },
        { value: 'latest', label: 'Latest' },
    ] as const;

    if (error) return <div className="flex justify-center items-center h-screen text-red-500">{error}</div>;

    return (
        <div className="w-full max-w-md mx-auto flex flex-col h-screen overflow-hidden bg-[#191922]">
            <div className="px-4 py-3 flex items-center gap-3 bg-[#191922] z-20 pt-[66px] sm:pt-[72px]">
                <input
                    type="text"
                    placeholder="Nickname Search"
                    className="flex-1 bg-[#22202A] rounded-lg px-3 py-3 text-sm text-white focus:outline-none"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                <button
                    className="w-[47px] h-[46px] flex items-center justify-center rounded-lg bg-[#22202A]"
                    onClick={() => setSearchTerm(inputValue)}
                >
                    <Image src="/icons/search.svg" alt="Search" width={23} height={23} />
                </button>
                <div className="relative">
                    <button
                        onClick={() => setIsFilterOpen((prev) => !prev)}
                        className={`w-[47px] h-[46px] flex items-center justify-center rounded-lg transition-colors ${
                            isFilterOpen ? 'bg-[#02F5D0]' : 'bg-[#22202A]'
                        }`}
                    >
                        <Image
                            src={isFilterOpen ? '/icons/filter-active.svg' : '/icons/filter.svg'}
                            alt="Filter"
                            width={26}
                            height={26}
                        />
                    </button>
                    {isFilterOpen && (
                        <Dropdown
                            options={filterOptions}
                            selected={filterType}
                            onSelect={(val) => {
                                setFilterType(val);
                                setIsFilterOpen(false);
                            }}
                        />
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-20 scrollbar-hide">
                <div className="bg-[#22202A] rounded-2xl overflow-hidden mt-2">
                    {!isLoading && displayedUsers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <p className="text-gray-400 text-sm mb-2">해당 사용자를 찾을 수 없습니다. 🏎️💨</p>
                        </div>
                    ) : (
                        <ul className="flex flex-col gap-3 p-4">
                            {displayedUsers.map((user, idx) => {
                                const realRank = user.rank;
                                return (
                                    <li
                                        key={`${user.id}-${idx}`}
                                        onClick={() => handleItemClick(user, idx + 1)}
                                        className={`cursor-pointer rounded-lg px-4 py-3 flex items-center justify-between bg-[#22202A] hover:bg-[#2A2833] active:scale-[0.98] transition-all
                                        ${realRank === 1 ? 'border-2 border-[#FDE56D]' : ''} 
                ${realRank === 2 ? 'border-2 border-[#AEB7C2]' : ''}
                ${realRank === 3 ? 'border-2 border-[#886050]' : ''}
            `}
                                    >
                                        <div className="flex flex-1 items-center gap-3 min-w-0">
                                            {/* 실제 순위가 1, 2, 3일 때만 트로피 표시 */}
                                            {realRank !== undefined && realRank <= 3 ? (
                                                <Image
                                                    src={`/icons/trophy-${realRank}.svg`}
                                                    alt="Trophy"
                                                    width={20}
                                                    height={20}
                                                />
                                            ) : (
                                                <span className="w-6 text-center font-bold text-white">
                                                    {realRank} {/* 실제 순위 숫자 표시 */}
                                                </span>
                                            )}
                                            <div className="flex flex-col flex-1 min-w-0">
                                                <span className="font-bold text-white truncate">{user.nickname}</span>
                                                <span className="block text-xs text-gray-300 truncate">
                                                    “{user.message}”
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-center gap-0.5 w-[32px]">
                                            <Image src="/icons/likes.svg" alt="Likes" width={16} height={16} />
                                            <span className="text-xs text-gray-300">{user.likes}</span>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}

                    {displayedUsers.length > 0 && (
                        <div
                            ref={loaderRef}
                            className="h-20 flex justify-center items-center text-gray-500 text-sm font-medium"
                        >
                            {isLoading ? (
                                <span>Loading...</span>
                            ) : (
                                !hasMore && <span>모든 응원을 확인했습니다 🏁 </span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <PodiumModal
                isOpen={!!selectedUser}
                isLoading={isModalLoading}
                nickname={selectedUser?.nickname || ''}
                message={
                    selectedUser
                        ? {
                              id: selectedUser.id,
                              number: `#${selectedUser.rank}`,
                              text: selectedUser.message,
                              isLiked: selectedUser.isLiked,
                          }
                        : null
                }
                onClose={() => setSelectedUser(null)}
                onLike={handleLike}
            />
        </div>
    );
};

PodiumPage.title = 'PODIUM';
export default PodiumPage;
