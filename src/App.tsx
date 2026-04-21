import { Link, Route, Routes, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import LogActions from './pages/LogActions';
import OrganDetail from './pages/OrganDetail';
import OrganOverview from './pages/OrganOverview';
import Settings from './pages/Settings';

export default function App() {
	const location = useLocation();
	const isHomePage = location.pathname === '/';

	return (
		<div className="flex min-h-svh flex-col bg-gradient-to-b from-emerald-50 via-white to-white text-slate-800">
			<header
				className={
					isHomePage
						? 'absolute inset-x-0 top-0 z-20'
						: 'mx-auto w-full max-w-5xl'
				}
			>
				<div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-6">
					<span className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
						PetMe
					</span>
					<nav className="flex gap-4 text-sm font-medium text-slate-600">
						<Link to="/">Home</Link>
						<Link to="/organs">Organs</Link>
						<Link to="/log">Log</Link>
						<Link to="/settings">Settings</Link>
					</nav>
				</div>
			</header>

			<main
				className={
					isHomePage
						? 'flex min-h-svh overflow-hidden'
						: 'mx-auto w-full max-w-5xl flex-1 px-4 pb-16'
				}
			>
				<Routes>
					<Route path="/" element={<Home />} />
					<Route path="/organs" element={<OrganOverview />} />
					<Route path="/organs/:organId" element={<OrganDetail />} />
					<Route path="/log" element={<LogActions />} />
					<Route path="/settings" element={<Settings />} />
				</Routes>
			</main>
		</div>
	);
}
