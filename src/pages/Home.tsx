import { useEffect, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { AvatarCanvas, type HomeSystemBar } from '../components/AvatarCanvas';
import { HomeLogModal } from '../components/HomeLogModal';
import { HomeLogWidgets } from '../components/HomeLogWidgets';
import { AvatarStatsOverlay } from '../components/AvatarStatsOverlay';
import AvatarThoughtBubble from '../components/AvatarThoughtBubble';
import { useHealth } from '../features/health/HealthContext';
import type { LogDomain } from '../features/health/logging';
import {
	FUTURE_SELF_SYSTEM_GROUPS,
	generateFutureSelfMessage,
	type FutureSelfMessage,
} from '../features/messages/futureSelfMessageService';

export default function Home() {
	const {
		latestImpactNarrative,
		latestImpactSummary,
		logEntries,
		organSummaries,
		overallScore,
		streaks,
	} = useHealth();
	const [thoughtBubbleMessage, setThoughtBubbleMessage] =
		useState<FutureSelfMessage | null>(null);
	const [isLoadingMessage, setIsLoadingMessage] = useState(false);
	const [activeLogDomain, setActiveLogDomain] = useState<LogDomain | null>(null);

	const systemBars = useMemo<HomeSystemBar[]>(
		() =>
			FUTURE_SELF_SYSTEM_GROUPS.map((group) => {
				const total = group.organs.reduce(
					(sum, organ) => sum + organSummaries[organ].progress,
					0,
				);

				return {
					id: group.id,
					label: group.label,
					progress: total / group.organs.length,
				};
			}),
		[organSummaries],
	);

	const systemSnapshots = useMemo(
		() =>
			systemBars.map((system) => ({
				id: system.id,
				label: system.label,
				score: Math.round(system.progress * 100),
			})),
		[systemBars],
	);

	const latestLogEntryId = logEntries[0]?.id ?? 'empty';

	const messageSignature = useMemo(
		() =>
			[
				latestLogEntryId,
				overallScore.toFixed(1),
				systemSnapshots.map((system) => `${system.id}:${system.score}`).join('|'),
			].join('::'),
		[latestLogEntryId, overallScore, systemSnapshots],
	);

	const messageContext = useMemo(
		() => ({
			overallScore,
			latestImpactNarrative,
			recentCheckInCount: logEntries.length,
			latestCheckInAt: logEntries[0]?.timestamp,
			logEntries,
			streaks,
			latestImpactSummary,
			systems: systemSnapshots,
		}),
		[
			latestImpactNarrative,
			latestImpactSummary,
			logEntries,
			overallScore,
			streaks,
			systemSnapshots,
		],
	);

	useEffect(() => {
		let isCancelled = false;

		const loadMessage = async () => {
			setIsLoadingMessage(true);

			try {
				const message = await generateFutureSelfMessage(messageContext);

				if (isCancelled) {
					return;
				}

				setThoughtBubbleMessage(message);
			} catch (error) {
				console.error('Failed to generate future self message.', error);

				if (isCancelled) {
					return;
				}

				setThoughtBubbleMessage({
					body: 'I am still here with you. One gentle check-in at a time is enough for me to reflect something useful back.',
					toneLabel: 'Fallback',
					source: 'fallback',
				});
			} finally {
				if (!isCancelled) {
					setIsLoadingMessage(false);
				}
			}
		};

		void loadMessage();

		return () => {
			isCancelled = true;
		};
	}, [messageContext, messageSignature]);

	return (
		<div className="relative h-svh w-full overflow-hidden">
			<Canvas
				className="h-svh w-full pointer-events-none"
				shadows
				camera={{ position: [0, 2, 5], fov: 30 }}
			>
				<color attach="background" args={['#ececec']} />
				<AvatarCanvas />
			</Canvas>

			<div className="pointer-events-none absolute inset-x-0 top-0 z-30 px-4 pt-20 sm:px-6 sm:pt-24">
				<div className="mx-auto flex w-full max-w-6xl justify-start">
					<div className="flex w-full justify-start">
						<AvatarThoughtBubble
							message={thoughtBubbleMessage}
							isLoading={isLoadingMessage}
						/>
					</div>
				</div>
			</div>

			<HomeLogWidgets onSelect={setActiveLogDomain} />

      <div className="pointer-events-none absolute inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+7.75rem)] z-40 px-4 sm:bottom-[8.5rem] sm:px-6">
        <div className="mx-auto flex w-full max-w-[38rem] justify-center">
          <AvatarStatsOverlay systemBars={systemBars} />
        </div>
      </div>

			{activeLogDomain ? (
				<HomeLogModal
					key={activeLogDomain}
					domain={activeLogDomain}
					onClose={() => setActiveLogDomain(null)}
				/>
			) : null}
		</div>
	);
}
