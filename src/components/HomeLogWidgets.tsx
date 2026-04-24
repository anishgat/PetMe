import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { faMoon } from '@fortawesome/free-regular-svg-icons';
import {
	faDumbbell,
	faFaceSmile,
	faFlask,
	faPen,
	faUtensils,
} from '@fortawesome/free-solid-svg-icons';
import type { LogDomain } from '../features/health/logging';

type FontAwesomeDefinition = {
	icon: [number, number, unknown, unknown, string | string[]];
};

function FontAwesomeGlyph({
	icon,
	className,
}: {
	icon: FontAwesomeDefinition;
	className: string;
}) {
	const [width, height, , , svgPathData] = icon.icon;
	const paths = Array.isArray(svgPathData) ? svgPathData : [svgPathData];

	return (
		<svg
			viewBox={`0 0 ${width} ${height}`}
			className={className}
			fill="currentColor"
			aria-hidden="true"
		>
			{paths.map((path) => (
				<path key={path} d={path} />
			))}
		</svg>
	);
}

type HomeLogWidget = {
	id: LogDomain;
	label: string;
	angle: number;
	toneClassName: string;
	icon: ReactNode;
};

const RADIAL_DISTANCE = 70;

const HOME_LOG_WIDGETS: HomeLogWidget[] = [
	{
		id: 'sleep',
		label: 'Sleep',
		angle: -90,
		toneClassName: 'from-sky-500 to-cyan-400',
		icon: <FontAwesomeGlyph icon={faMoon} className="h-5 w-5" />,
	},
	{
		id: 'mood',
		label: 'Mood',
		angle: -30,
		toneClassName: 'from-fuchsia-500 to-violet-500',
		icon: <FontAwesomeGlyph icon={faFaceSmile} className="h-5 w-5" />,
	},
	{
		id: 'social',
		label: 'Social',
		angle: 30,
		toneClassName: 'from-rose-500 to-pink-500',
		icon: (
			<svg
				viewBox="0 0 24 24"
				className="h-5 w-5"
				fill="none"
				stroke="currentColor"
				strokeWidth="1.8"
			>
				<path d="M7.5 11.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM16.5 12.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM4.5 18a3.5 3.5 0 0 1 7 0M13 18a3 3 0 0 1 6 0" />
			</svg>
		),
	},
	{
		id: 'substances',
		label: 'Substances',
		angle: 90,
		toneClassName: 'from-slate-700 to-slate-500',
		icon: <FontAwesomeGlyph icon={faFlask} className="h-5 w-5" />,
	},
	{
		id: 'diet',
		label: 'Diet',
		angle: 150,
		toneClassName: 'from-amber-500 to-orange-400',
		icon: <FontAwesomeGlyph icon={faUtensils} className="h-5 w-5" />,
	},
	{
		id: 'movement',
		label: 'Movement',
		angle: 210,
		toneClassName: 'from-emerald-500 to-lime-400',
		icon: <FontAwesomeGlyph icon={faDumbbell} className="h-5 w-5" />,
	},
];

function getOffset(angle: number) {
	const radians = (angle * Math.PI) / 180;

	return {
		x: Math.cos(radians) * RADIAL_DISTANCE,
		y: Math.sin(radians) * RADIAL_DISTANCE,
	};
}

export function HomeLogWidgets({
	onSelect,
}: {
	onSelect: (domain: LogDomain) => void;
}) {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const [isExpanded, setIsExpanded] = useState(false);
	const [activeWidgetId, setActiveWidgetId] = useState<LogDomain | null>(null);

	const widgetPositions = useMemo(
		() =>
			HOME_LOG_WIDGETS.map((widget) => ({
				...widget,
				...getOffset(widget.angle),
			})),
		[],
	);

	const activeWidget =
		widgetPositions.find((widget) => widget.id === activeWidgetId) ?? null;

	const collapseMenu = useCallback(() => {
		setIsExpanded(false);
		setActiveWidgetId(null);
	}, []);

	useEffect(() => {
		if (!isExpanded) {
			return;
		}

		const handleWindowPointerDown = (event: PointerEvent) => {
			if (
				containerRef.current != null &&
				!containerRef.current.contains(event.target as Node)
			) {
				collapseMenu();
			}
		};

		const handleWindowKeyDown = (event: KeyboardEvent) => {
			if (event.key !== 'Escape') {
				return;
			}

			collapseMenu();
		};

		window.addEventListener('pointerdown', handleWindowPointerDown);
		window.addEventListener('keydown', handleWindowKeyDown);

		return () => {
			window.removeEventListener('pointerdown', handleWindowPointerDown);
			window.removeEventListener('keydown', handleWindowKeyDown);
		};
	}, [collapseMenu, isExpanded]);

	return (
		<div className="pointer-events-none absolute inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+4.25rem)] z-50 flex justify-center px-4 sm:bottom-6">
			<div
				ref={containerRef}
				className="pointer-events-auto relative h-[15rem] w-[15rem] touch-none select-none"
			>
				<div
					id="home-log-widget-panel"
					className="absolute bottom-[2.375rem] left-1/2 h-0 w-0 -translate-x-1/2"
				>
					<div
						className={`absolute left-0 top-0 h-[11rem] w-[11rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.18)_0%,rgba(255,255,255,0)_68%)] transition duration-300 ${
							isExpanded ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
						}`}
						aria-hidden="true"
					/>

					{widgetPositions.map((widget) => {
						const isActive = activeWidgetId === widget.id;
						const travel = isExpanded ? 1 : 0.16;
						const scale = isExpanded ? (isActive ? 1.16 : 1) : 0.72;

						return (
							<button
								key={widget.id}
								type="button"
								onClick={() => {
									onSelect(widget.id);
									collapseMenu();
								}}
								onMouseEnter={() => setActiveWidgetId(widget.id)}
								onFocus={() => setActiveWidgetId(widget.id)}
								onMouseLeave={() => setActiveWidgetId(null)}
								onBlur={() => setActiveWidgetId(null)}
								aria-hidden={!isExpanded}
								aria-label={widget.label}
								tabIndex={isExpanded ? 0 : -1}
								className={`absolute left-0 top-0 grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br text-white shadow-[0_18px_30px_-18px_rgba(15,23,42,0.65)] ring-1 ring-white/70 transition-[transform,opacity,box-shadow] duration-200 sm:h-13 sm:w-13 ${
									widget.toneClassName
								} ${isActive ? 'shadow-[0_18px_42px_-12px_rgba(15,23,42,0.75)]' : ''} ${
									isExpanded
										? 'pointer-events-auto opacity-100'
										: 'pointer-events-none opacity-0'
								}`}
								style={{
									transform: `translate(calc(-50% + ${widget.x * travel}px), calc(-50% + ${widget.y * travel}px)) scale(${scale})`,
								}}
							>
								{widget.icon}
							</button>
						);
					})}
				</div>

				<div className="absolute bottom-[9.5rem] left-1/2 flex -translate-x-1/2 justify-center">
					<div
						className={`rounded-full border border-white/80 bg-white/86 px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-600 shadow-[0_14px_26px_-20px_rgba(15,23,42,0.6)] backdrop-blur transition duration-200 ${
							isExpanded ? 'opacity-100' : 'opacity-0'
						}`}
					>
						{activeWidget?.label ?? 'Choose a check-in'}
					</div>
				</div>

				<button
					type="button"
					onClick={() => {
						setIsExpanded((current) => {
							const nextExpanded = !current;

							if (!nextExpanded) {
								setActiveWidgetId(null);
							}

							return nextExpanded;
						});
					}}
					aria-label={isExpanded ? 'Close logging options' : 'Open logging options'}
					aria-expanded={isExpanded}
					aria-controls="home-log-widget-panel"
					className={`absolute bottom-0 left-1/2 flex h-[4.75rem] w-[4.75rem] -translate-x-1/2 touch-none select-none items-center justify-center rounded-full border border-white/85 bg-white/18 text-white shadow-[0_20px_45px_-18px_rgba(5,150,105,0.95)] backdrop-blur-xl transition duration-200 ${
						isExpanded
							? 'scale-[1.04] bg-emerald-600/95 ring-8 ring-emerald-300/20'
							: 'bg-emerald-600/92 hover:bg-emerald-700'
					}`}
				>
					<span className="grid h-10 w-10 place-items-center rounded-full bg-white/18">
						<FontAwesomeGlyph icon={faPen} className="h-5 w-5" />
					</span>
				</button>
			</div>
		</div>
	);
}
