import React, { useMemo, useState } from 'react';

type EventCategory =
  | 'school'
  | 'holiday'
  | 'exam'
  | 'grading'
  | 'religious'
  | 'national';

interface CalendarEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string; // Exclusive end date
  category: EventCategory;
  description?: string;
  estimated?: boolean;
}

const events: CalendarEvent[] = [
  {
    id: 'school-admin',
    title: 'Signing of Entry Reports',
    startDate: '2026-09-01',
    endDate: '2026-09-03',
    category: 'school',
    description:
      'Signing of entry reports for administration, inspection, and teaching staff.',
  },
  {
    id: 'school-students',
    title: 'Progressive Student Arrival',
    startDate: '2026-09-03',
    endDate: '2026-09-06',
    category: 'school',
    description:
      'Progressive arrival of students according to their levels.',
  },
  {
    id: 'school-start',
    title: 'School Year Begins',
    startDate: '2026-09-07',
    endDate: '2026-09-08',
    category: 'school',
    description: 'Official start of compulsory classes.',
  },
  {
    id: 'holiday-1',
    title: 'Interim Holiday',
    startDate: '2026-10-18',
    endDate: '2026-10-27',
    category: 'holiday',
    description: 'First interim school holiday.',
  },
  {
    id: 'national-unity',
    title: 'Unity Day',
    startDate: '2026-10-31',
    endDate: '2026-11-01',
    category: 'national',
  },
  {
    id: 'green-march',
    title: 'Green March Anniversary',
    startDate: '2026-11-06',
    endDate: '2026-11-07',
    category: 'national',
  },
  {
    id: 'independence',
    title: 'Independence Day',
    startDate: '2026-11-18',
    endDate: '2026-11-19',
    category: 'national',
  },
  {
    id: 'holiday-2',
    title: 'Interim Holiday',
    startDate: '2026-12-06',
    endDate: '2026-12-15',
    category: 'holiday',
    description: 'Second interim school holiday.',
  },
  {
    id: 'new-year',
    title: 'New Year',
    startDate: '2027-01-01',
    endDate: '2027-01-02',
    category: 'national',
  },
  {
    id: 'continuous-assessment-1',
    title: 'Continuous Assessment',
    startDate: '2027-01-04',
    endDate: '2027-01-12',
    category: 'exam',
    description:
      'Final continuous assessments for the first term.',
  },
  {
    id: 'independence-document',
    title: 'Independence Manifesto Day',
    startDate: '2027-01-11',
    endDate: '2027-01-12',
    category: 'national',
  },
  {
    id: 'amazigh-new-year',
    title: 'Amazigh New Year',
    startDate: '2027-01-14',
    endDate: '2027-01-15',
    category: 'national',
  },
  {
    id: 'local-exam',
    title: 'Unified Exam - Local',
    startDate: '2027-01-18',
    endDate: '2027-01-20',
    category: 'exam',
    description:
      'Local unified exam for sixth grade primary.',
  },
  {
    id: 'mid-year',
    title: 'Mid-Year Holiday',
    startDate: '2027-01-24',
    endDate: '2027-02-01',
    category: 'holiday',
    description: 'Mid-year school holiday.',
  },
  {
    id: 'holiday-3',
    title: 'Interim Holiday',
    startDate: '2027-03-21',
    endDate: '2027-03-30',
    category: 'holiday',
    description: 'Third interim school holiday.',
  },
  {
    id: 'labour-day',
    title: 'Labour Day',
    startDate: '2027-05-01',
    endDate: '2027-05-02',
    category: 'national',
  },
  {
    id: 'holiday-4',
    title: 'Interim Holiday',
    startDate: '2027-05-09',
    endDate: '2027-05-18',
    category: 'holiday',
    description: 'Fourth interim school holiday.',
  },
  {
    id: 'continuous-assessment-2',
    title: 'Continuous Assessment',
    startDate: '2027-06-14',
    endDate: '2027-06-22',
    category: 'exam',
    description:
      'Final continuous assessments for the second term.',
  },
  {
    id: 'regional-exam',
    title: 'Unified Exam - Regional',
    startDate: '2027-06-25',
    endDate: '2027-06-27',
    category: 'exam',
    description:
      'Regional unified exam for sixth grade primary.',
  },
  {
    id: 'grading-final',
    title: 'Final Grading & Class Councils',
    startDate: '2027-07-01',
    endDate: '2027-07-04',
    category: 'grading',
    description:
      'Issuing reports, holding class councils, and distributing final grades.',
  },
  {
    id: 'school-end',
    title: 'Signing of Exit Reports',
    startDate: '2027-07-10',
    endDate: '2027-07-11',
    category: 'school',
    description:
      'Signing of exit reports for teaching staff.',
  },

  // Estimated religious dates
  {
    id: 'ramadan',
    title: 'Ramadan',
    startDate: '2027-02-08',
    endDate: '2027-03-10',
    category: 'religious',
    estimated: true,
    description:
      'Estimated date. Subject to official confirmation.',
  },
  {
    id: 'eid-fitr',
    title: 'Eid al-Fitr',
    startDate: '2027-03-10',
    endDate: '2027-03-12',
    category: 'religious',
    estimated: true,
    description:
      'Estimated date. Subject to official confirmation.',
  },
  {
    id: 'eid-adha',
    title: 'Eid al-Adha',
    startDate: '2027-05-17',
    endDate: '2027-05-19',
    category: 'religious',
    estimated: true,
    description:
      'Estimated date. Subject to official confirmation.',
  },
  {
    id: 'muharram',
    title: 'Islamic New Year',
    startDate: '2027-06-06',
    endDate: '2027-06-07',
    category: 'religious',
    estimated: true,
    description:
      'Estimated date. Subject to official confirmation.',
  },
];

const categoryLabels: Record<EventCategory, string> = {
  school: 'School',
  holiday: 'Holiday',
  exam: 'Exam',
  grading: 'Grading',
  religious: 'Religious',
  national: 'National',
};

const categoryClasses: Record<EventCategory, string> = {
  school: 'bg-blue-100 text-blue-700',
  holiday: 'bg-green-100 text-green-700',
  exam: 'bg-red-100 text-red-700',
  grading: 'bg-purple-100 text-purple-700',
  religious: 'bg-amber-100 text-amber-700',
  national: 'bg-slate-100 text-slate-700',
};

function parseDate(date: string) {
  return new Date(`${date}T00:00:00`);
}

function formatDate(date: string) {
  return parseDate(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getInclusiveEndDate(exclusiveEndDate: string) {
  const date = parseDate(exclusiveEndDate);
  date.setDate(date.getDate() - 1);

  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatEventDate(event: CalendarEvent) {
  const start = formatDate(event.startDate);
  const end = getInclusiveEndDate(event.endDate);

  return start === end ? start : `${start} - ${end}`;
}

export default function AcademicCalendarPage() {
  const [selectedCategory, setSelectedCategory] = useState<
    'all' | EventCategory
  >('all');

  const [selectedEvent, setSelectedEvent] =
    useState<CalendarEvent | null>(null);

  const filteredEvents = useMemo(() => {
    if (selectedCategory === 'all') {
      return events;
    }

    return events.filter(
      (event) => event.category === selectedCategory
    );
  }, [selectedCategory]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">

        {/* Header */}
        <div className="mb-6">
          <p className="text-sm font-medium text-slate-500">
            Academic Year 2026/2027
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            Academic Calendar
          </h1>

          <p className="mt-2 text-slate-600">
            Important school dates, holidays, assessments, and
            academic events.
          </p>
        </div>

        {/* Academic Year */}
        <div className="mb-6 grid gap-4 md:grid-cols-2">

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              First Term
            </p>

            <p className="mt-1 text-lg font-semibold text-slate-900">
              7 Sep 2026 - 23 Jan 2027
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Second Term
            </p>

            <p className="mt-1 text-lg font-semibold text-slate-900">
              1 Feb 2027 - 3 Jul 2027
            </p>
          </div>

        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-2">

          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            All
          </button>

          {(Object.keys(categoryLabels) as EventCategory[]).map(
            (category) => (
              <button
                key={category}
                type="button"
                onClick={() =>
                  setSelectedCategory(category)
                }
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  selectedCategory === category
                    ? categoryClasses[category]
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {categoryLabels[category]}
              </button>
            )
          )}

        </div>

        {/* Events */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="font-semibold text-slate-900">
              Academic Events
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {filteredEvents.length} event
              {filteredEvents.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="divide-y divide-slate-100">

            {filteredEvents.map((event) => (
              <button
                key={event.id}
                type="button"
                onClick={() => setSelectedEvent(event)}
                className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left transition hover:bg-slate-50"
              >
                <div className="min-w-0">

                  <div className="flex flex-wrap items-center gap-2">

                    <h3 className="font-medium text-slate-900">
                      {event.title}
                    </h3>

                    {event.estimated && (
                      <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-700">
                        Estimated
                      </span>
                    )}

                  </div>

                  <p className="mt-1 text-sm text-slate-500">
                    {formatEventDate(event)}
                  </p>

                </div>

                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${categoryClasses[event.category]}`}
                >
                  {categoryLabels[event.category]}
                </span>
              </button>
            ))}

            {filteredEvents.length === 0 && (
              <div className="px-6 py-12 text-center text-slate-500">
                No events found.
              </div>
            )}

          </div>
        </div>

        {/* Event Modal */}
        {selectedEvent && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
            onClick={() => setSelectedEvent(null)}
          >
            <div
              className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >

              <div className="flex items-start justify-between gap-4">

                <div>

                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${categoryClasses[selectedEvent.category]}`}
                  >
                    {categoryLabels[selectedEvent.category]}
                  </span>

                  <h2 className="mt-3 text-xl font-bold text-slate-900">
                    {selectedEvent.title}
                  </h2>

                  {selectedEvent.estimated && (
                    <span className="mt-2 inline-flex rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-medium text-yellow-700">
                      Estimated date
                    </span>
                  )}

                </div>

                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Close"
                >
                  ×
                </button>

              </div>

              <div className="mt-6 space-y-5">

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Date
                  </p>

                  <p className="mt-1 text-slate-800">
                    {formatEventDate(selectedEvent)}
                  </p>
                </div>

                {selectedEvent.description && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Details
                    </p>

                    <p className="mt-1 leading-6 text-slate-700">
                      {selectedEvent.description}
                    </p>
                  </div>
                )}

                {selectedEvent.estimated && (
                  <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm leading-6 text-yellow-800">
                    This date is estimated and may be updated
                    when the official date is confirmed.
                  </div>
                )}

              </div>

              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="mt-6 w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Close
              </button>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}