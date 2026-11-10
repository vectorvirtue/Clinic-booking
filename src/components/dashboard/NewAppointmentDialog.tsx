import { useState, type FormEvent } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Icon } from '../Icon'

export function NewAppointmentDialog() {
  const [open, setOpen] = useState(false)
  const [notice, setNotice] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice('The appointment form is ready. Connect the booking API to save appointments.')
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (nextOpen) setNotice('')
      }}
    >
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
              <Dialog.Description className="mt-1.5 text-sm text-slate-500">Add a patient appointment to your clinic schedule.</Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button aria-label="Close dialog" className="grid size-9 shrink-0 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800">
                <span aria-hidden="true" className="text-xl leading-none">×</span>
              </button>
            </Dialog.Close>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-slate-700">Patient name</span>
              <input autoComplete="name" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#829bbd] focus:ring-2 focus:ring-[#294878]/10" placeholder="Enter patient's full name" required />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-slate-700">Email address</span>
              <input autoComplete="email" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#829bbd] focus:ring-2 focus:ring-[#294878]/10" placeholder="patient@example.com" required type="email" />
            </label>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-slate-700">Provider</span>
                <select className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#829bbd] focus:ring-2 focus:ring-[#294878]/10" defaultValue="" required>
                  <option disabled value="">Select provider</option>
                  <option>Dr. Ade Okafor</option>
                  <option>Dr. Chidi Nwosu</option>
                  <option>Dr. Adaeze Bello</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-slate-700">Appointment type</span>
                <select className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#829bbd] focus:ring-2 focus:ring-[#294878]/10" defaultValue="" required>
                  <option disabled value="">Select type</option>
                  <option>General consultation</option>
                  <option>Follow-up visit</option>
                  <option>Dental cleaning</option>
                </select>
              </label>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-slate-700">Date</span>
                <input className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#829bbd] focus:ring-2 focus:ring-[#294878]/10" required type="date" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-slate-700">Time</span>
                <input className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#829bbd] focus:ring-2 focus:ring-[#294878]/10" required type="time" />
              </label>
            </div>

            {notice && <p className="rounded-lg bg-[#eaf0f7] px-3 py-2.5 text-xs leading-5 text-[#294878]" role="status">{notice}</p>}

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
              <Dialog.Close asChild>
                <button className="rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50" type="button">Cancel</button>
              </Dialog.Close>
              <button className="rounded-lg bg-[#294878] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#203b63] focus:outline-none focus:ring-2 focus:ring-[#8ba6c8] focus:ring-offset-2" type="submit">Create appointment</button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
