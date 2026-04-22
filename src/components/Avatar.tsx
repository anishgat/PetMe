import { useEffect, useMemo, useRef } from 'react';
import type { ThreeElements } from '@react-three/fiber';
import { useAnimations, useGLTF } from '@react-three/drei';
import type { AnimationClip, Group } from 'three';
import type { GLTF } from 'three-stdlib';
import { SkeletonUtils } from 'three-stdlib';

type AvatarProps = ThreeElements['group'];

type GLTFResult = GLTF & {
	scene: Group;
	animations: AnimationClip[];
};

export const Avatar = (props: AvatarProps) => {
	const { scene, animations } = useGLTF('/models/model3.glb') as GLTFResult;
	const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);
	const group = useRef<Group>(null);
	const { actions } = useAnimations(animations, group);

	useEffect(() => {
		const idleAction = actions?.[animations[0]?.name];
		if (!idleAction) return;

		idleAction.reset().fadeIn(0.3).play();
		return () => {
			idleAction.fadeOut(0.3);
		};
	}, [actions, animations]);

	return (
		<group ref={group} {...props} dispose={null}>
			<primitive object={clone} />
		</group>
	);
};
