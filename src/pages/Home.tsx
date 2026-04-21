import { Canvas } from '@react-three/fiber';
import { AvatarCanvas } from '../components/AvatarCanvas';

export default function Home() {
	return (
		<div className="h-svh w-full">
			<Canvas className="h-svh w-full" shadows camera={{ position: [0, 2, 5], fov: 30 }}>
				<color attach="background" args={['#ececec']} />
				<AvatarCanvas />
			</Canvas>
		</div>
	);
}
