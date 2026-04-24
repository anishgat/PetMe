import { Link, Route, Routes, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import LogActions from './pages/LogActions';
import OrganDetail from './pages/OrganDetail';
import OrganOverview from './pages/OrganOverview';
import Settings from './pages/Settings';
import Signup from './pages/Signup';

export default function App() {
	const location = useLocation();
	const isHomePage = location.pathname === '/';
	const isLogPage = location.pathname === '/log';
	const isSignupPage = location.pathname === '/signup';

	return (
		<div
			className={`flex min-h-svh flex-col text-slate-800 ${
				isHomePage
					? 'bg-[#ececec]'
					: isSignupPage
						? 'bg-[#f4ecdf]'
						: 'bg-gradient-to-b from-emerald-50 via-white to-white'
			}`}
		>
			<header
				className={
					isHomePage
						? 'absolute inset-x-0 top-0 z-50 bg-transparent'
						: isSignupPage
							? 'absolute inset-x-0 top-0 z-50 bg-transparent'
							: 'mx-auto w-full max-w-5xl'
				}
			>
				<div className="pointer-events-auto mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-6">
					<Link
						to="/"
						className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700"
					>
						PetMe
					</Link>
					{isSignupPage ? (
						<Link
							to="/"
							className="inline-flex items-center rounded-full border border-slate-300/80 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 shadow-sm backdrop-blur transition hover:bg-white"
						>
							Skip for now
						</Link>
					) : (
						<Link
							to="/settings"
							aria-label="Open settings"
							className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-emerald-200/90 bg-white/85 text-emerald-700 shadow-sm backdrop-blur transition hover:bg-white"
						>
							<svg
								viewBox="0 0 24 24"
								className="h-5 w-5"
								fill="none"
								stroke="currentColor"
								strokeWidth="1.9"
							>
								<path d="M12 3.5a2.5 2.5 0 0 1 2.4 1.7l.2.5a2.5 2.5 0 0 0 2.1 1.6l.6.1a2.5 2.5 0 0 1 1.3 4.4l-.5.4a2.5 2.5 0 0 0-.8 2.5l.1.6a2.5 2.5 0 0 1-3.6 2.7l-.5-.3a2.5 2.5 0 0 0-2.6 0l-.5.3a2.5 2.5 0 0 1-3.6-2.7l.1-.6a2.5 2.5 0 0 0-.8-2.5l-.5-.4a2.5 2.5 0 0 1 1.3-4.4l.6-.1a2.5 2.5 0 0 0 2.1-1.6l.2-.5A2.5 2.5 0 0 1 12 3.5Z" />
								<circle cx="12" cy="12" r="2.8" />
							</svg>
						</Link>
					)}
				</div>
			</header>

			<main
				className={
					isHomePage
						? 'flex min-h-svh overflow-hidden'
						: isSignupPage
							? 'relative flex min-h-svh flex-1 overflow-hidden'
							: 'mx-auto w-full max-w-5xl flex-1 px-4 pb-24'
				}
			>
				<Routes>
					<Route path="/" element={<Home />} />
					<Route path="/signup" element={<Signup />} />
					<Route path="/organs" element={<OrganOverview />} />
					<Route path="/organs/:organId" element={<OrganDetail />} />
					<Route path="/log" element={<LogActions />} />
					<Route path="/settings" element={<Settings />} />
				</Routes>
			</main>

			{!isLogPage && !isHomePage && !isSignupPage && (
				<div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4 pb-[env(safe-area-inset-bottom)] sm:bottom-6">
					<Link
						to="/log"
						className="pointer-events-auto inline-flex w-full max-w-xs items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_-10px_rgba(5,150,105,0.85)] transition hover:bg-emerald-700 sm:w-auto"
					>
						Log check-in
					</Link>
				</div>
			)}
		</div>
	);
}
