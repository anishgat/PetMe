import { Html } from '@react-three/drei';
import type { HealthStatCard } from '../features/health/HealthContext';

type AvatarStatsOverlayProps = {
	statCards: HealthStatCard[];
};

export const AvatarStatsOverlay = ({ statCards }: AvatarStatsOverlayProps) => {
	return (
		<Html fullscreen>
			<div className="pointer-events-none flex h-full w-full items-start justify-center px-4 pb-4 pt-24 sm:justify-end sm:px-8 sm:pb-10 sm:pt-24">
				<div className="grid w-full max-w-xs gap-3 sm:w-80 sm:max-w-sm">
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
										style={{ width: `${Math.round(card.progress * 100)}%` }}
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
