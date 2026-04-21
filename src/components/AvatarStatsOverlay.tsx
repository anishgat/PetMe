import { Html } from '@react-three/drei';

const statCards = [
	{
		label: 'Movement',
		value: '8,426',
		unit: 'steps',
		accent: 'from-emerald-400/80 via-lime-300/60 to-transparent',
		ring: 'border-emerald-200/70',
		tint: 'text-emerald-950',
		note: '+12% vs yesterday',
	},
	{
		label: 'Sleep',
		value: '7.8',
		unit: 'hours',
		accent: 'from-sky-400/80 via-cyan-200/60 to-transparent',
		ring: 'border-sky-200/70',
		tint: 'text-sky-950',
		note: 'REM rhythm stable',
	},
	{
		label: 'Mood',
		value: 'Calm',
		unit: 'steady',
		accent: 'from-amber-300/80 via-orange-200/60 to-transparent',
		ring: 'border-orange-200/80',
		tint: 'text-orange-950',
		note: 'Energy is balanced',
	},
] as const;

export const AvatarStatsOverlay = () => {
	return (
		<Html fullscreen>
			<div className="pointer-events-none flex h-full w-full items-end justify-center px-4 pb-8 pt-28 sm:items-start sm:justify-end sm:px-8 sm:pb-10 sm:pt-24">
				<div className="grid w-full max-w-sm gap-3 sm:w-80">
					{statCards.map((card) => (
						<section
							key={card.label}
							className={`relative overflow-hidden rounded-[28px] border ${card.ring} bg-white/42 p-4 shadow-[0_24px_80px_-30px_rgba(15,23,42,0.45)] backdrop-blur-xl`}
						>
							<div
								className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${card.accent} opacity-80`}
							/>
							<div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-white/50" />

							<div className={`relative ${card.tint}`}>
								<div className="flex items-start justify-between gap-3">
									<div>
										<p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-slate-500">
											{card.label}
										</p>
										<div className="mt-2 flex items-end gap-2">
											<span className="text-3xl font-black leading-none tracking-[-0.04em]">
												{card.value}
											</span>
											<span className="pb-1 text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-slate-500">
												{card.unit}
											</span>
										</div>
									</div>

									<div className="mt-1 h-9 w-9 rounded-full border border-white/55 bg-white/28 shadow-inner shadow-white/40" />
								</div>

								<div className="mt-4 h-2 overflow-hidden rounded-full bg-white/35">
									<div
										className="h-full rounded-full bg-slate-900/75"
										style={{
											width:
												card.label === 'Movement'
													? '78%'
													: card.label === 'Sleep'
														? '84%'
														: '72%',
										}}
									/>
								</div>

								<p className="mt-3 text-sm font-medium text-slate-600">{card.note}</p>
							</div>
						</section>
					))}
				</div>
			</div>
		</Html>
	);
};
