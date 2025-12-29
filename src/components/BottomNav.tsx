import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';

const navItems = [
    { href: '/', iconName: 'home', alt: 'Home' },
    { href: '/podium', iconName: 'trophy', alt: 'Trophy' },
    { href: '/fan-radio', iconName: 'radio', alt: 'Radio' },
    { href: '/my-page', iconName: 'user', alt: 'User' },
];

const BottomNav = () => {
    const router = useRouter();

    return (
        <div className="fixed bottom-0 w-full bg-[#22202A] z-30 safe-area-padding">
            <div className="max-w-md mx-auto px-4 py-3 sm:py-4 flex justify-between items-center">
                {navItems.map((item) => {
                    const isActive = router.pathname === item.href;
                    const iconSrc = `/icons/${item.iconName}${isActive ? '-active' : ''}.svg`;

                    return (
                        <Link href={item.href} key={item.href} className="flex items-center justify-center">
                            <Image
                                src={iconSrc}
                                alt={item.alt}
                                width={28}
                                height={28}
                                className={item.iconName === 'radio' ? 'translate-y-[5px]' : ''}
                            />
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};

export default BottomNav;
