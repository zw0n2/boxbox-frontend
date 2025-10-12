'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

const MainPage = () => {
    const [diffDays, setDiffDays] = useState<number | null>(null);
    // 신호등의 켜짐(true)/꺼짐(false) 상태를 배열로 관리
    const [lightsOn, setLightsOn] = useState<boolean[]>([false, false, false, false, false]);
    const totalLights = 5;

    // 아자잣,,,!!!
    useEffect(() => {
        // 1. 목표 날짜를 설정
        const targetDate = new Date('2025-10-12T00:00:00+09:00');

        // 2. 현재 시간을 사용자의 위치와 상관없이 항상 KST로 계산
        const now = new Date(); // 현재 사용자의 로컬 시간
        const utc = now.getTime() + now.getTimezoneOffset() * 60000;
        const kstOffset = 9 * 60 * 60 * 1000; // KST는 UTC+9
        const todayInKorea = new Date(utc + kstOffset);

        const today = new Date(todayInKorea.getFullYear(), todayInKorea.getMonth(), todayInKorea.getDate());
        today.setHours(0, 0, 0, 0);

        // 3. KST 기준으로 D-Day 계산
        const diffTime = targetDate.getTime() - today.getTime();
        const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setDiffDays(days);

        // D-Day 당일 및 이후 (애니메이션 효과)
        if (days <= 0) {
            // 1. 처음에는 모든 불을 켜기
            setLightsOn(Array(totalLights).fill(true));

            // 2. 1.5초 후에 모든 불을 끄는 "Lights Out" 애니메이션을 실행
            const timer = setTimeout(() => {
                setLightsOn(Array(totalLights).fill(false));
            }, 1500); // 1.5초 딜레이

            // 컴포넌트가 사라질 때 타이머를 정리하여 메모리 누수를 방지
            return () => clearTimeout(timer);
        }
        // D-5 ~ D-1 카운트다운
        else if (days <= 5) {
            const lightsToTurnOn = totalLights - days + 1;
            const newLightsState = Array.from({ length: totalLights }, (_, i) => i < lightsToTurnOn);
            setLightsOn(newLightsState);
        }
        // D-5 이전 (모두 꺼진 상태)
        else {
            setLightsOn(Array(totalLights).fill(false));
        }
    }, []); // 이 useEffect는 페이지가 처음 로드될 때 한 번만 실행

    return (
        <div className="w-full max-w-md mx-auto pt-[66px] sm:pt-[72px]">
            {/* D-Day  */}
            <div className="relative w-full h-[102px] bg-[#111111] rounded-b-[30px] mx-auto">
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center text-white">
                    <p className="text-[12px]  tracking-[0.5px] mt-1">PEACHES X F1 MERCEDES AMG</p>
                    {/* diffDays가 계산되기 전에는 로딩 상태를 보여줄 수 있습니다. */}
                    <h2 className="text-[36px]  font-bold tracking-[0.5px] ">
                        {diffDays !== null ? `D-${diffDays > 0 ? diffDays : 'Day'}` : 'Loading...'}
                    </h2>
                </div>
            </div>

            {/* 신호등 */}
            <div className="relative z-20 -mt-1 flex justify-center gap-[18px]">
                {lightsOn.map((isOn, i) => (
                    <Image
                        key={i}
                        src={isOn ? '/icons/light-on.svg' : '/icons/light-off.svg'}
                        alt={isOn ? 'Light On' : 'Light Off'}
                        width={40}
                        height={80}
                        className="w-[40px] h-[80px]"
                    />
                ))}
            </div>

            {/* 라디오 카드 */}
            <div
                id="fan-radio-card"
                className="bg-[#0F0F14] rounded-xl mx-auto flex flex-col gap-1 w-[90%] max-w-[340px] mt-4"
            >
                <div className="p-4">
                    <h2 className="font-bold text-right text-[#02F5D0] text-[24px]">KOREA F1 FANS</h2>
                    <div className="flex justify-end items-center gap-2">
                        <Image src="/icons/mercedes-logo.svg" alt="Mercedes Logo" width={24} height={24} />
                        <span className="font-bold text-[30px]">Radio</span>
                    </div>
                </div>

                <div className="relative w-full -mt-6">
                    <Image
                        src="/icons/radio-wave.svg"
                        alt="Radio Wave"
                        width={800}
                        height={150}
                        className="w-full h-auto object-contain"
                    />
                    <div className="w-full h-[2px] bg-[#444D56] mt-1" />
                    <Image
                        src="/icons/radio-wave2.svg"
                        alt="Radio Wave Shadow"
                        width={800}
                        height={150}
                        className="w-full h-auto object-contain -mt-1.5"
                    />
                </div>

                <div className="p-4">
                    <p className="text-white text-[17px] text-right leading-relaxed">
                        “WELCOME TO KOREA,
                        <br /> AMG &amp; BOTTAS!”
                    </p>
                </div>
            </div>

            {/* 메인 이미지 */}
            <div className="w-full flex justify-center -mt-6">
                <Image
                    src="/images/main.svg"
                    alt="Main Background"
                    layout="intrinsic"
                    width={520}
                    height={380}
                    className="opacity-50 scale-90"
                />
            </div>

            {/* 문의 메일 */}
            <div className="w-full text-center mt-6 mb-4">
                <p className="text-[12px] text-gray-400">
                    버그 및 사이트 관련 문의:{' '}
                    <a href="mailto:wjdwlr03@gmail.com" className="underline">
                        wjdwlr03@gmail.com
                    </a>
                    <br />
                    <a href="https://www.instagram.com/_gamja_o_o/?igsh=MXJkcHZ4ZmtudTNxYg%3D%3D&utm_source=qr#" className="underline">
                        @_gamja_o_o
                    </a>
                </p>
                <p className="text-[12px] text-gray-400">본 사이트는 비영리·비상업적 팬 프로젝트로,</p>
                <p className="text-[12px] text-gray-400">어떠한 상업적 목적도 지니지 않음을 명시합니다.</p>
            </div>
        </div>
    );
};

MainPage.title = 'BoxBox';
export default MainPage;
