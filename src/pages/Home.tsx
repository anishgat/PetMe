import { Canvas } from '@react-three/fiber';
import { AvatarCanvas } from '../components/AvatarCanvas';
import { useHealth } from '../features/health/HealthContext';

export default function Home() {
	const { statCards } = useHealth();

	return (
		<div className="h-svh w-full overflow-hidden">
			<Canvas
				className="h-svh w-full pointer-events-none"
				shadows
				camera={{ position: [0, 2, 5], fov: 30 }}
			>
				<color attach="background" args={['#ececec']} />
				<AvatarCanvas statCards={statCards} />
			</Canvas>
		</div>
	);
}
