import { useEffect, useState, type FormEvent } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { ApiError, apiRequest } from '../../lib/api'
import { formatDate, formatTime, getLocalDate, type AppointmentSlot, type Booking, type SlotsResponse } from '../../lib/clinic'
import { Icon } from '../Icon'

type AppointmentConfirmation = Booking & { slot: AppointmentSlot }

function getToday() {
  return getLocalDate(new Date().toISOString())
}

export function NewAppointmentDialog({ onBookingCreated }: { onBookingCreated?: () => void }) {
  const [open, setOpen] = useState(false)
  const [slots, setSlots] = useState<AppointmentSlot[]>([])
  const [selectedProvider, setSelectedProvider] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSlotId, setSelectedSlotId] = useState('')
  const [currentTime, setCurrentTime] = useState(() => Date.now())
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [confirmation, setConfirmation] = useState<AppointmentConfirmation | null>(null)

  useEffect(() => {
    if (!open) return

    const controller = new AbortController()
    apiRequest<SlotsResponse>('/slots', { signal: controller.signal })
      .then(({ slots: loadedSlots }) => {
        setSlots(loadedSlots)
        const firstAvailable = loadedSlots.find(
          (slot) => slot.available && new Date(slot.start).getTime() > currentTime,
        )
        if (firstAvailable) {
          setSelectedProvider(firstAvailable.provider)
          setSelectedDate(getLocalDate(firstAvailable.start))
          setSelectedSlotId(firstAvailable.id)
        }
      })
      .catch((requestError: unknown) => {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return
        setError(requestError instanceof Error ? requestError.message : 'Unable to load appointment times.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingSlots(false)
      })

    return () => controller.abort()
  }, [open, currentTime])

  const availableSlots = slots.filter(
    (slot) => slot.available && new Date(slot.start).getTime() > currentTime,
  )
  const providers = [...new Set(availableSlots.map((slot) => slot.provider))]
  const providerSlots = availableSlots.filter((slot) => slot.provider === selectedProvider)
  const dateSlots = providerSlots.filter((slot) => getLocalDate(slot.start) === selectedDate)

  function handleProviderChange(provider: string) {
    const firstSlot = availableSlots.find((slot) => slot.provider === provider)
    setSelectedProvider(provider)
    setSelectedDate(firstSlot ? getLocalDate(firstSlot.start) : '')
    setSelectedSlotId(firstSlot?.id ?? '')
    setError('')
  }

  function handleDateChange(date: string) {
    const firstSlot = providerSlots.find((slot) => getLocalDate(slot.start) === date)
    setSelectedDate(date)
    setSelectedSlotId(firstSlot?.id ?? '')
    setError('')
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && isSubmitting) return
    setOpen(nextOpen)
    if (nextOpen) {
      setCurrentTime(Date.now())
      setSlots([])
      setSelectedProvider('')
      setSelectedDate('')
      setSelectedSlotId('')
      setError('')
      setConfirmation(null)
      setIsLoadingSlots(true)
    } else {
      setIsLoadingSlots(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const name = String(formData.get('name') ?? '').trim()
    const email = String(formData.get('email') ?? '').trim().toLowerCase()

    if (!name || !email || !selectedSlotId) {
      setError(!selectedSlotId
        ? 'Choose an available appointment time before continuing.'
        : 'Enter the patient’s name and email address.')
      return
    }
    const selectedSlot = slots.find((slot) => slot.id === selectedSlotId)
    if (!selectedSlot) {
      setError('That appointment time is no longer available. Refresh the dialog and choose another time.')
      return
    }

    setError('')
    setIsSubmitting(true)
    try {
      const booking = await apiRequest<Booking>('/bookings', {
        method: 'POST',
        headers: { 'Idempotency-Key': crypto.randomUUID() },
        body: JSON.stringify({ slot_id: selectedSlotId, name, email }),
      })
      setConfirmation({ ...booking, slot: selectedSlot })
      onBookingCreated?.()
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setError(requestError.status === 409
          ? 'That appointment time was just booked. Choose another available time.'
          : requestError.status === 429 && requestError.retryAfter
            ? `${requestError.message}. Try again in ${requestError.retryAfter} seconds.`
            : requestError.message)
      } else {
        setError(requestError instanceof Error ? requestError.message : 'Unable to save the appointment. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>
        <button className="inline-flex items-center gap-2 rounded-xl bg-[#294878] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#203b63] focus:outline-none focus:ring-2 focus:ring-[#8ba6c8] focus:ring-offset-2">
          <Icon name="plus" size={17} /> New appointment
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-[2px] data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out data-[state=open]:fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl focus:outline-none sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-xl font-semibold tracking-tight text-slate-900">New appointment</Dialog.Title>
              <Dialog.Description className="mt-1.5 text-sm text-slate-500">Book a patient into an available clinic appointment time.</Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button aria-label="Close dialog" className="grid size-9 shrink-0 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800">
                <span aria-hidden="true" className="text-xl leading-none">×</span>
              </button>
            </Dialog.Close>
          </div>

          {confirmation ? (
            <div className="mt-6 space-y-4">
              <p className="rounded-lg bg-emerald-50 px-3 py-3 text-sm text-emerald-800" role="status">
                Appointment confirmed for {confirmation.name} with {confirmation.slot.provider} on {formatDate(confirmation.slot.start)} at {formatTime(confirmation.slot.start)}.
              </p>
              <p className="text-xs text-slate-500">Booking ID: {confirmation.id}</p>
              <div className="flex justify-end border-t border-slate-100 pt-5">
                <Dialog.Close asChild>
                  <button className="rounded-lg bg-[#294878] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#203b63]" type="button">Done</button>
                </Dialog.Close>
              </div>
            </div>
          ) : (
            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-slate-700">Patient name</span>
                <input autoComplete="name" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#829bbd] focus:ring-2 focus:ring-[#294878]/10" disabled={isSubmitting} name="name" placeholder="Enter patient's full name" required />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-slate-700">Email address</span>
                <input autoComplete="email" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#829bbd] focus:ring-2 focus:ring-[#294878]/10" disabled={isSubmitting} name="email" placeholder="patient@example.com" required type="email" />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-slate-700">Provider</span>
                <select
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#829bbd] focus:ring-2 focus:ring-[#294878]/10"
                  disabled={isLoadingSlots || isSubmitting || providers.length === 0}
                  onChange={(event) => handleProviderChange(event.target.value)}
                  required
                  value={selectedProvider}
                >
                  <option disabled value="">{isLoadingSlots ? 'Loading providers…' : 'Select provider'}</option>
                  {providers.map((provider) => <option key={provider} value={provider}>{provider}</option>)}
                </select>
              </label>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-slate-700">Date</span>
                  <input
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#829bbd] focus:ring-2 focus:ring-[#294878]/10"
                    disabled={isLoadingSlots || isSubmitting || !selectedProvider}
                    min={getToday()}
                    onChange={(event) => handleDateChange(event.target.value)}
                    required
                    type="date"
                    value={selectedDate}
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-slate-700">Available time</span>
                  <select
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#829bbd] focus:ring-2 focus:ring-[#294878]/10"
                    disabled={isLoadingSlots || isSubmitting || dateSlots.length === 0}
                    onChange={(event) => setSelectedSlotId(event.target.value)}
                    required
                    value={selectedSlotId}
                  >
                    <option disabled value="">Select time</option>
                    {dateSlots.map((slot) => (
                      <option key={slot.id} value={slot.id}>{formatTime(slot.start)} – {formatTime(slot.end)}</option>
                    ))}
                  </select>
                </label>
              </div>

              {error && <p className="rounded-lg bg-rose-50 px-3 py-2.5 text-xs leading-5 text-rose-700" role="alert">{error}</p>}
              {!isLoadingSlots && !error && availableSlots.length === 0 && (
                <p className="rounded-lg bg-[#eaf0f7] px-3 py-2.5 text-xs leading-5 text-[#294878]" role="status">
                  No future appointment times are available. Add slots to the clinic schedule before booking.
                </p>
              )}
              {isLoadingSlots && <p className="text-xs text-slate-500" role="status">Loading available appointment times…</p>}

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                <Dialog.Close asChild>
                  <button className="rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50" type="button">Cancel</button>
                </Dialog.Close>
                <button className="rounded-lg bg-[#294878] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#203b63] focus:outline-none focus:ring-2 focus:ring-[#8ba6c8] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" disabled={isLoadingSlots || isSubmitting || availableSlots.length === 0} type="submit">
                  {isSubmitting ? 'Saving…' : 'Create appointment'}
                </button>
              </div>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
