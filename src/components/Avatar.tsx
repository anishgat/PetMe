import { useEffect, useMemo, useRef } from 'react';
import { useAnimations, useGLTF } from '@react-three/drei';
import { useGraph, type ThreeElements } from '@react-three/fiber';
import type {
	AnimationClip,
	BufferGeometry,
	Group,
	Material,
	Object3D,
	Skeleton,
	SkinnedMesh,
} from 'three';
import type { GLTF } from 'three-stdlib';
import { SkeletonUtils } from 'three-stdlib';

type AvatarProps = ThreeElements['group'];

type GLTFResult = GLTF & {
	scene: Group;
	animations: AnimationClip[];
};

type AvatarNode = SkinnedMesh & {
	geometry: BufferGeometry;
	skeleton: Skeleton;
	morphTargetDictionary?: Record<string, number>;
	morphTargetInfluences?: number[];
};

type AvatarGraph = {
	nodes: {
		Hips: Object3D;
		Body_Mesh: AvatarNode;
		avaturn_hair_0: AvatarNode;
		avaturn_hair_1: AvatarNode;
		avaturn_shoes_0: AvatarNode;
		avaturn_look_0: AvatarNode;
		avaturn_look_1: AvatarNode;
		Eye_Mesh: AvatarNode;
		EyeAO_Mesh: AvatarNode;
		Eyelash_Mesh: AvatarNode;
		Head_Mesh: AvatarNode;
		Teeth_Mesh: AvatarNode;
		Tongue_Mesh: AvatarNode;
	};
	materials: Record<
		| 'Body'
		| 'avaturn_hair_0_material'
		| 'avaturn_hair_1_material'
		| 'avaturn_shoes_0_material'
		| 'avaturn_look_0_material'
		| 'avaturn_look_1_material'
		| 'Eyes'
		| 'EyeAO'
		| 'Eyelash'
		| 'Head'
		| 'Teeth',
		Material
	>;
};

export const Avatar = (props: AvatarProps) => {
	const { scene, animations } = useGLTF('/models/anish-transformed.glb') as GLTFResult;
	const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);
	const { nodes, materials } = useGraph(clone) as unknown as AvatarGraph;
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
			<group name="Scene">
				<group name="Armature">
					<primitive object={nodes.Hips} />
				</group>
				<skinnedMesh
					name="Body_Mesh"
					geometry={nodes.Body_Mesh.geometry}
					material={materials.Body}
					skeleton={nodes.Body_Mesh.skeleton}
				/>
				<skinnedMesh
					name="avaturn_hair_0"
					geometry={nodes.avaturn_hair_0.geometry}
					material={materials.avaturn_hair_0_material}
					skeleton={nodes.avaturn_hair_0.skeleton}
				/>
				<skinnedMesh
					name="avaturn_hair_1"
					geometry={nodes.avaturn_hair_1.geometry}
					material={materials.avaturn_hair_1_material}
					skeleton={nodes.avaturn_hair_1.skeleton}
				/>
				<skinnedMesh
					name="avaturn_shoes_0"
					geometry={nodes.avaturn_shoes_0.geometry}
					material={materials.avaturn_shoes_0_material}
					skeleton={nodes.avaturn_shoes_0.skeleton}
				/>
				<skinnedMesh
					name="avaturn_look_0"
					geometry={nodes.avaturn_look_0.geometry}
					material={materials.avaturn_look_0_material}
					skeleton={nodes.avaturn_look_0.skeleton}
				/>
				<skinnedMesh
					name="avaturn_look_1"
					geometry={nodes.avaturn_look_1.geometry}
					material={materials.avaturn_look_1_material}
					skeleton={nodes.avaturn_look_1.skeleton}
				/>
				<skinnedMesh
					name="Eye_Mesh"
					geometry={nodes.Eye_Mesh.geometry}
					material={materials.Eyes}
					skeleton={nodes.Eye_Mesh.skeleton}
					morphTargetDictionary={nodes.Eye_Mesh.morphTargetDictionary}
					morphTargetInfluences={nodes.Eye_Mesh.morphTargetInfluences}
				/>
				<skinnedMesh
					name="EyeAO_Mesh"
					geometry={nodes.EyeAO_Mesh.geometry}
					material={materials.EyeAO}
					skeleton={nodes.EyeAO_Mesh.skeleton}
					morphTargetDictionary={nodes.EyeAO_Mesh.morphTargetDictionary}
					morphTargetInfluences={nodes.EyeAO_Mesh.morphTargetInfluences}
				/>
				<skinnedMesh
					name="Eyelash_Mesh"
					geometry={nodes.Eyelash_Mesh.geometry}
					material={materials.Eyelash}
					skeleton={nodes.Eyelash_Mesh.skeleton}
					morphTargetDictionary={nodes.Eyelash_Mesh.morphTargetDictionary}
					morphTargetInfluences={nodes.Eyelash_Mesh.morphTargetInfluences}
				/>
				<skinnedMesh
					name="Head_Mesh"
					geometry={nodes.Head_Mesh.geometry}
					material={materials.Head}
					skeleton={nodes.Head_Mesh.skeleton}
					morphTargetDictionary={nodes.Head_Mesh.morphTargetDictionary}
					morphTargetInfluences={nodes.Head_Mesh.morphTargetInfluences}
				/>
				<skinnedMesh
					name="Teeth_Mesh"
					geometry={nodes.Teeth_Mesh.geometry}
					material={materials.Teeth}
					skeleton={nodes.Teeth_Mesh.skeleton}
					morphTargetDictionary={nodes.Teeth_Mesh.morphTargetDictionary}
					morphTargetInfluences={nodes.Teeth_Mesh.morphTargetInfluences}
				/>
				<skinnedMesh
					name="Tongue_Mesh"
					geometry={nodes.Tongue_Mesh.geometry}
					material={materials.Teeth}
					skeleton={nodes.Tongue_Mesh.skeleton}
					morphTargetDictionary={nodes.Tongue_Mesh.morphTargetDictionary}
					morphTargetInfluences={nodes.Tongue_Mesh.morphTargetInfluences}
				/>
			</group>
		</group>
	);
};

useGLTF.preload('/models/anish-transformed.glb');
