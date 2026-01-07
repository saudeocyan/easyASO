import React, { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { ViewState, UserProfile } from '../types';

interface LayoutProps {
    children: ReactNode;
    currentView: ViewState;
    onChangeView: (view: ViewState) => void;
    userProfile: UserProfile;
    onOpenConvocation: () => void;
    onLogout: () => void;
    headerTitle: string;
    headerSubtitle?: string;
    onNotificationsClick: () => void;
}

const Layout: React.FC<LayoutProps> = ({
    children,
    currentView,
    onChangeView,
    userProfile,
    onOpenConvocation,
    onLogout,
    headerTitle,
    headerSubtitle,
    onNotificationsClick
}) => {
    return (
        <div className="flex h-screen w-full bg-background-light text-text-main overflow-hidden font-body">
            <Sidebar
                currentView={currentView}
                onChangeView={onChangeView}
                userProfile={userProfile}
                onOpenConvocation={onOpenConvocation}
                onLogout={onLogout}
            />

            <main className="flex-1 flex flex-col h-full overflow-hidden bg-background-light">
                <Header
                    title={headerTitle}
                    subtitle={headerSubtitle}
                    onNotificationsClick={onNotificationsClick}
                />

                {children}
            </main>
        </div>
    );
};

export default Layout;
