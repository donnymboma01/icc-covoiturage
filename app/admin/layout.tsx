'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/hooks/useAuth';
import { Loader2, Users, Car, Calendar } from 'lucide-react';
import Link from 'next/link';
const AdminLayout = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    const router = useRouter();
    const { user, loading } = useAuth();

    useEffect(() => {
        console.log('Admin layout - User:', user);
        console.log('Admin layout - isAdmin:', user?.isAdmin);

        if (!loading && (!user || user.isAdmin !== true)) {
            console.log('Redirection - Utilisateur non admin');
            router.push('/');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user?.isAdmin) {
        return null;
    }

    return (
        <div className="bg-gray-100 flex flex-col flex-1">
            <main className="flex-1 p-4 sm:p-6">
                {children}
            </main>
        </div>
    );
}

export default AdminLayout;