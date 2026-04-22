import { ContactShadows, Environment, OrbitControls, Sky } from '@react-three/drei';
import { Avatar } from './Avatar';
import { AvatarStatsOverlay } from './AvatarStatsOverlay';
import type { HealthStatCard } from '../features/health/HealthContext';

type AvatarCanvasProps = {
	statCards: HealthStatCard[];
};

export const AvatarCanvas = ({ statCards }: AvatarCanvasProps) => {
	return (
		<>
			<OrbitControls />
			<Sky />
			<Environment preset="sunset" />
			<AvatarStatsOverlay statCards={statCards} />
			<group position-y={-1}>
				<ContactShadows
					opacity={1}
					scale={10}
					blur={1}
					far={10}
					resolution={256}
					color="#000000"
				/>
				<Avatar />
				<mesh scale={5} rotation-x={-Math.PI * 0.5} position-y={-0.001}>
					<planeGeometry />
					<meshStandardMaterial color="white" />
				</mesh>
			</group>
		</>
	);
};
