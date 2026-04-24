import {
	type ChangeEvent,
	type FormEvent,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react'
import { useNavigate } from 'react-router-dom'

type PhotoSlotId = 'front' | 'left' | 'right'

type PhotoUpload = {
	fileName: string
	previewUrl: string
}

type ProfileForm = {
	fullName: string
	email: string
	ageRange: string
	goal: string
}

type PhotoSlot = {
	id: PhotoSlotId
	label: string
	hint: string
	accentClassName: string
}

type WearableOption = {
	id: string
	name: string
	summary: string
	toneClassName: string
}

const photoSlots: PhotoSlot[] = [
	{
		id: 'front',
		label: 'Front-facing',
		hint: 'Neutral lighting, face and shoulders centered.',
		accentClassName: 'from-rose-200 via-orange-100 to-transparent',
	},
	{
		id: 'left',
		label: 'Left profile',
		hint: 'Turn slightly so the side contour is easy to read.',
		accentClassName: 'from-emerald-200 via-teal-100 to-transparent',
	},
	{
		id: 'right',
		label: 'Right profile',
		hint: 'Match the left shot so the avatar reads evenly.',
		accentClassName: 'from-sky-200 via-cyan-100 to-transparent',
	},
]

const wearableOptions: WearableOption[] = [
	{
		id: 'fitbit',
		name: 'Fitbit',
		summary: 'Sleep stages, resting heart rate, and readiness trends.',
		toneClassName: 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-900',
	},
	{
		id: 'garmin',
		name: 'Garmin',
		summary: 'Training load, recovery, HRV, and workout history.',
		toneClassName: 'border-sky-200 bg-sky-50 text-sky-900',
	},
	{
		id: 'apple-health',
		name: 'Apple Health',
		summary: 'Activity rings, mobility, and health summary signals.',
		toneClassName: 'border-slate-300 bg-white text-slate-900',
	},
	{
		id: 'oura',
		name: 'Oura',
		summary: 'Sleep quality, recovery windows, and daily resilience.',
		toneClassName: 'border-amber-200 bg-amber-50 text-amber-950',
	},
]

const initialPhotos: Record<PhotoSlotId, PhotoUpload | null> = {
	front: null,
	left: null,
	right: null,
}

const initialForm: ProfileForm = {
	fullName: '',
	email: '',
	ageRange: '',
	goal: '',
}

function PhotoSilhouette({ slot }: { slot: PhotoSlotId }) {
	return (
		<div className="flex h-full w-full flex-col items-center justify-center text-slate-500">
			<div className="relative h-28 w-24">
				<div
					className={`absolute left-1/2 top-0 h-12 w-12 -translate-x-1/2 rounded-full border border-current ${
						slot === 'front' ? '' : slot === 'left' ? '-translate-x-[42%]' : '-translate-x-[58%]'
					}`}
				/>
				<div
					className={`absolute bottom-0 left-1/2 h-20 w-20 -translate-x-1/2 rounded-t-[2rem] rounded-b-[1.3rem] border border-current ${
						slot === 'front' ? '' : slot === 'left' ? '-translate-x-[38%] skew-x-[8deg]' : '-translate-x-[62%] -skew-x-[8deg]'
					}`}
				/>
			</div>
			<p className="mt-3 text-[0.7rem] font-semibold uppercase tracking-[0.24em]">
				Avatar scan
			</p>
		</div>
	)
}

export default function Signup() {
	const navigate = useNavigate()
	const [form, setForm] = useState<ProfileForm>(initialForm)
	const [selectedWearables, setSelectedWearables] = useState<string[]>([])
	const [photos, setPhotos] =
		useState<Record<PhotoSlotId, PhotoUpload | null>>(initialPhotos)
	const photosRef = useRef(photos)

	const completedPhotoCount = useMemo(
		() => Object.values(photos).filter(Boolean).length,
		[photos],
	)

	const canSubmit =
		form.fullName.trim() !== '' &&
		form.email.trim() !== '' &&
		form.ageRange.trim() !== '' &&
		completedPhotoCount === photoSlots.length

	useEffect(() => {
		photosRef.current = photos
	}, [photos])

	useEffect(() => {
		return () => {
			Object.values(photosRef.current).forEach((photo) => {
				if (photo?.previewUrl) {
					URL.revokeObjectURL(photo.previewUrl)
				}
			})
		}
	}, [])

	const handlePhotoChange =
		(slotId: PhotoSlotId) => (event: ChangeEvent<HTMLInputElement>) => {
			const file = event.target.files?.[0]

			if (!file) {
				return
			}

			setPhotos((current) => {
				const previousPhoto = current[slotId]

				if (previousPhoto?.previewUrl) {
					URL.revokeObjectURL(previousPhoto.previewUrl)
				}

				return {
					...current,
					[slotId]: {
						fileName: file.name,
						previewUrl: URL.createObjectURL(file),
					},
				}
			})
		}

	const handleWearableToggle = (wearableId: string) => {
		setSelectedWearables((current) =>
			current.includes(wearableId)
				? current.filter((item) => item !== wearableId)
				: [...current, wearableId],
		)
	}

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()

		if (!canSubmit) {
			return
		}

		navigate('/')
	}

	return (
		<div className="relative isolate w-full overflow-hidden">
			<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.95),_transparent_32%),radial-gradient(circle_at_80%_15%,_rgba(245,158,11,0.14),_transparent_22%),radial-gradient(circle_at_75%_80%,_rgba(14,165,233,0.12),_transparent_24%),linear-gradient(180deg,_#f4ecdf_0%,_#f8f5ef_45%,_#fcfbf7_100%)]" />
			<div className="pointer-events-none absolute left-[-5rem] top-28 h-48 w-48 rounded-full bg-[#cce8d9]/60 blur-3xl" />
			<div className="pointer-events-none absolute right-[-2rem] top-40 h-56 w-56 rounded-full bg-[#ffd7c1]/50 blur-3xl" />

			<div className="relative mx-auto flex min-h-svh w-full max-w-6xl flex-col px-4 pb-10 pt-24 sm:px-6 lg:flex-row lg:gap-8 lg:px-8 lg:pb-14">
				<section className="flex-1 pb-8 pt-4 lg:flex lg:max-w-[27rem] lg:flex-col lg:justify-between lg:pb-0 lg:pt-10">
					<div>
						<p
							className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-slate-500"
							style={{
								fontFamily:
									'"Trebuchet MS", "Gill Sans", "Segoe UI", sans-serif',
							}}
						>
							Onboarding
						</p>
						<h1
							className="mt-4 max-w-md text-5xl leading-[0.92] text-slate-900 sm:text-6xl"
							style={{
								fontFamily:
									'"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif',
							}}
						>
							Build the version of you your future self can inhabit.
						</h1>
						<p className="mt-5 max-w-lg text-base leading-7 text-slate-600 sm:text-lg">
							Give PetMe a few essentials, add three reference photos, and
							optionally connect a wearable. The avatar starts from your current
							baseline, then changes with each check-in.
						</p>
					</div>

					<div className="mt-8 grid gap-4 sm:grid-cols-3 lg:mt-10 lg:grid-cols-1">
						<div className="rounded-[1.75rem] border border-white/80 bg-white/70 p-5 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.45)] backdrop-blur">
							<p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
								Avatar Kit
							</p>
							<p className="mt-3 text-4xl font-semibold text-slate-900">
								{completedPhotoCount}/3
							</p>
							<p className="mt-2 text-sm leading-6 text-slate-600">
								Photo angles uploaded for the first body pass.
							</p>
						</div>
						<div className="rounded-[1.75rem] border border-white/80 bg-[#1f3b35] p-5 text-white shadow-[0_24px_70px_-40px_rgba(15,23,42,0.45)]">
							<p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-emerald-200">
								Sync Mode
							</p>
							<p className="mt-3 text-2xl font-semibold">
								{selectedWearables.length === 0
									? 'Manual first'
									: `${selectedWearables.length} paired`}
							</p>
							<p className="mt-2 text-sm leading-6 text-emerald-50/80">
								You can start with manual logs and add device data later.
							</p>
						</div>
						<div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-transparent p-5">
							<p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
								First Check-in
							</p>
							<p className="mt-3 text-xl font-semibold text-slate-900">
								Live right after signup
							</p>
							<p className="mt-2 text-sm leading-6 text-slate-600">
								Finish setup and start logging against your first avatar
								baseline immediately.
							</p>
						</div>
					</div>
				</section>

				<section className="flex-1 lg:min-w-0 lg:pt-6">
					<form
						onSubmit={handleSubmit}
						className="rounded-[2rem] border border-white/80 bg-white/78 p-5 shadow-[0_28px_90px_-42px_rgba(15,23,42,0.45)] backdrop-blur sm:p-7"
					>
						<div className="flex flex-col gap-3 border-b border-slate-200/80 pb-6 sm:flex-row sm:items-end sm:justify-between">
							<div>
								<p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
									Create your profile
								</p>
								<h2
									className="mt-2 text-3xl text-slate-900 sm:text-4xl"
									style={{
										fontFamily:
											'"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif',
									}}
								>
									Shape the first snapshot
								</h2>
							</div>
							<p className="max-w-sm text-sm leading-6 text-slate-500">
								Set up your profile, add your reference angles, and choose any
								device connections you want from day one.
							</p>
						</div>

						<div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
							<div className="space-y-6">
								<section>
									<p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
										Basic information
									</p>
									<div className="mt-4 grid gap-4 sm:grid-cols-2">
										<label className="block sm:col-span-2">
											<span className="text-sm font-semibold text-slate-700">
												Name or nickname
											</span>
											<input
												type="text"
												required
												value={form.fullName}
												onChange={(event) =>
													setForm((current) => ({
														...current,
														fullName: event.target.value,
													}))
												}
												placeholder="What should your companion call you?"
												className="mt-2 w-full rounded-[1.15rem] border border-slate-200 bg-[#fbfaf6] px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white"
											/>
										</label>

										<label className="block">
											<span className="text-sm font-semibold text-slate-700">
												Email
											</span>
											<input
												type="email"
												required
												value={form.email}
												onChange={(event) =>
													setForm((current) => ({
														...current,
														email: event.target.value,
													}))
												}
												placeholder="name@example.com"
												className="mt-2 w-full rounded-[1.15rem] border border-slate-200 bg-[#fbfaf6] px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white"
											/>
										</label>

										<label className="block">
											<span className="text-sm font-semibold text-slate-700">
												Age range
											</span>
											<select
												required
												value={form.ageRange}
												onChange={(event) =>
													setForm((current) => ({
														...current,
														ageRange: event.target.value,
													}))
												}
												className="mt-2 w-full rounded-[1.15rem] border border-slate-200 bg-[#fbfaf6] px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:bg-white"
											>
												<option value="">Select one</option>
												<option value="13-17">13-17</option>
												<option value="18-24">18-24</option>
												<option value="25-34">25-34</option>
												<option value="35-44">35-44</option>
												<option value="45-54">45-54</option>
												<option value="55+">55+</option>
											</select>
										</label>

										<label className="block sm:col-span-2">
											<span className="text-sm font-semibold text-slate-700">
												What do you want this future-self companion to help with?
											</span>
											<textarea
												rows={4}
												value={form.goal}
												onChange={(event) =>
													setForm((current) => ({
														...current,
														goal: event.target.value,
													}))
												}
												placeholder="Example: build steadier sleep, train more consistently, and stay less stressed."
												className="mt-2 w-full rounded-[1.15rem] border border-slate-200 bg-[#fbfaf6] px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white"
											/>
										</label>
									</div>
								</section>

								<section>
									<div className="flex items-end justify-between gap-4">
										<div>
											<p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
												Avatar photos
											</p>
											<h3 className="mt-2 text-xl font-semibold text-slate-900">
												Upload three angles
											</h3>
										</div>
										<p className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
											Required
										</p>
									</div>

									<div className="mt-4 grid gap-4">
										{photoSlots.map((slot) => {
											const photo = photos[slot.id]

											return (
												<label
													key={slot.id}
													className="group block cursor-pointer rounded-[1.4rem] border border-slate-200 bg-[#fbfaf6] p-3 transition hover:border-slate-300 hover:bg-white"
												>
													<input
														type="file"
														required
														accept="image/*"
														onChange={handlePhotoChange(slot.id)}
														className="sr-only"
													/>

													<div className="grid gap-4 sm:grid-cols-[10rem_minmax(0,1fr)] sm:items-center">
														<div
															className={`relative overflow-hidden rounded-[1.2rem] border border-slate-200 bg-gradient-to-br ${slot.accentClassName} aspect-[4/5] min-h-44`}
														>
															{photo ? (
																<img
																	src={photo.previewUrl}
																	alt={`${slot.label} preview`}
																	className="h-full w-full object-cover"
																/>
															) : (
																<PhotoSilhouette slot={slot.id} />
															)}
														</div>

														<div>
															<div className="flex flex-wrap items-center gap-2">
																<p className="text-base font-semibold text-slate-900">
																	{slot.label}
																</p>
																{photo ? (
																	<span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-emerald-700">
																		Ready
																	</span>
																) : null}
															</div>
															<p className="mt-2 text-sm leading-6 text-slate-600">
																{slot.hint}
															</p>
															<div className="mt-4 flex flex-wrap items-center gap-3">
																<span className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white transition group-hover:bg-slate-800">
																	{photo ? 'Replace image' : 'Choose image'}
																</span>
																<p className="text-xs text-slate-500">
																	{photo?.fileName ?? 'JPG or PNG'}
																</p>
															</div>
														</div>
													</div>
												</label>
											)
										})}
									</div>
								</section>
							</div>

							<div className="space-y-6">
								<section className="rounded-[1.5rem] border border-slate-200 bg-[#fcfbf8] p-4 sm:p-5">
									<p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
										Wearables
									</p>
									<h3 className="mt-2 text-xl font-semibold text-slate-900">
										Pair a device now or later
									</h3>
									<p className="mt-2 text-sm leading-6 text-slate-600">
										Choose the wearables you want alongside your manual check-ins
										and health signals.
									</p>

									<div className="mt-4 space-y-3">
										{wearableOptions.map((option) => {
											const isSelected = selectedWearables.includes(option.id)

											return (
												<button
													key={option.id}
													type="button"
													onClick={() => handleWearableToggle(option.id)}
													className={`w-full rounded-[1.2rem] border px-4 py-4 text-left transition ${
														isSelected
															? option.toneClassName
															: 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
													}`}
												>
													<div className="flex items-start justify-between gap-3">
														<div>
															<p className="text-sm font-semibold">{option.name}</p>
															<p className="mt-1 text-sm leading-6 opacity-80">
																{option.summary}
															</p>
														</div>
														<span
															className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
																isSelected
																	? 'border-current bg-white/70'
																	: 'border-slate-300 text-slate-400'
															}`}
														>
															{isSelected ? 'OK' : '+'}
														</span>
													</div>
												</button>
											)
										})}
									</div>

									<button
										type="button"
										onClick={() => setSelectedWearables([])}
										className="mt-4 text-sm font-semibold text-slate-500 transition hover:text-slate-800"
									>
										Skip wearable pairing
									</button>
								</section>

								<section className="rounded-[1.5rem] border border-slate-200 bg-[#1b2f2b] p-5 text-white">
									<p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-emerald-200">
										Before you continue
									</p>
									<ul className="mt-4 space-y-3 text-sm leading-6 text-emerald-50/85">
										<li>Use clear, well-lit photos so your avatar starts from a cleaner baseline.</li>
										<li>Pick any devices you want to include in your health tracking routine.</li>
										<li>After signup, your avatar home becomes your daily check-in space.</li>
									</ul>
								</section>

								<section className="rounded-[1.5rem] border border-dashed border-slate-300 p-5">
									<p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
										Completion
									</p>
									<div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
										<div
											className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 transition-all"
											style={{
												width: `${Math.round(
													((completedPhotoCount + (canSubmit ? 1 : 0)) / 4) * 100,
												)}%`,
											}}
										/>
									</div>
									<p className="mt-3 text-sm leading-6 text-slate-600">
										Complete the required profile fields and all three photos to
										enable the signup action.
									</p>
								</section>
							</div>
						</div>

						<div className="mt-8 flex flex-col gap-3 border-t border-slate-200/80 pt-6 sm:flex-row sm:items-center sm:justify-between">
							<p className="text-sm leading-6 text-slate-500">
								Required: name, email, age range, and three avatar reference
								photos.
							</p>
							<div className="flex flex-col gap-3 sm:flex-row">
								<button
									type="button"
									onClick={() => navigate('/')}
									className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
								>
									Maybe later
								</button>
								<button
									type="submit"
									disabled={!canSubmit}
									className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_32px_-18px_rgba(15,23,42,0.8)] transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
								>
									Sign up and meet your avatar
								</button>
							</div>
						</div>
					</form>
				</section>
			</div>
		</div>
	)
}
