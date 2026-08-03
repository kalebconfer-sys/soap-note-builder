/**
 * PDF rendering. Imported lazily by the export menu so @react-pdf/renderer
 * stays out of the initial bundle — it is by far the heaviest dependency and
 * most sessions never export.
 */

import { Document, Page, StyleSheet, Text, View, pdf } from '@react-pdf/renderer'
import { specialtyLabel } from './clinical.js'
import {
  bmiCategory,
  calculateBMI,
  displayTitle,
  examNarrative,
  hpiFromElements,
  rosNarrative,
  rxLine,
  vitalsLine,
} from './note.js'

const styles = StyleSheet.create({
  page: { paddingTop: 44, paddingBottom: 52, paddingHorizontal: 48, fontSize: 10, lineHeight: 1.45, color: '#21252e' },
  title: { fontSize: 15, fontWeight: 'bold', marginBottom: 3 },
  meta: { fontSize: 9, color: '#657592', marginBottom: 2 },
  rule: { borderBottomWidth: 1, borderBottomColor: '#d5dae3', marginTop: 8, marginBottom: 12 },
  sectionHeading: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#26706f',
    marginTop: 12,
    marginBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#aeddd9',
    paddingBottom: 2,
  },
  label: { fontWeight: 'bold' },
  para: { marginBottom: 5 },
  row: { flexDirection: 'row', marginBottom: 2 },
  rowLabel: { width: 96, fontWeight: 'bold', color: '#505e79' },
  rowValue: { flex: 1 },
  listItem: { marginBottom: 4, paddingLeft: 10 },
  sub: { paddingLeft: 10, color: '#414c62' },
  footer: {
    position: 'absolute',
    bottom: 26,
    left: 48,
    right: 48,
    fontSize: 8,
    color: '#8593ac',
    borderTopWidth: 1,
    borderTopColor: '#d5dae3',
    paddingTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
})

function Row({ label, children }) {
  if (!children) return null
  return (
    <View style={styles.row} wrap={false}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{children}</Text>
    </View>
  )
}

function NoteDocument({ note, profile }) {
  const s = note.sections
  const hpi = [hpiFromElements(s.S.hpiElements), s.S.hpi.trim()].filter(Boolean).join('\n')
  const ros = rosNarrative(s.S.ros, s.S.rosNotes)
  const exam = examNarrative(s.O.exam)
  const vitals = vitalsLine(s.O.vitals)
  const bmi = calculateBMI(s.O.vitals.htIn, s.O.vitals.wtLb)
  const headerBits = [profile.displayName, profile.program, profile.school].filter(Boolean).join('  ·  ')

  return (
    <Document title={displayTitle(note)} author={profile.displayName || 'SOAP Note Builder'}>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.title}>{displayTitle(note)}</Text>
        {headerBits ? <Text style={styles.meta}>{headerBits}</Text> : null}
        <Text style={styles.meta}>
          {specialtyLabel(note.specialty)}  ·  {new Date(note.updatedAt).toLocaleDateString()}
          {profile.preceptor ? `  ·  Preceptor: ${profile.preceptor}` : ''}
        </Text>
        <View style={styles.rule} />

        <Text style={styles.sectionHeading}>S — SUBJECTIVE</Text>
        <Row label="Chief complaint">{s.S.chiefComplaint.trim()}</Row>
        {hpi ? (
          <View style={styles.para}>
            <Text style={styles.label}>HPI</Text>
            <Text>{hpi}</Text>
          </View>
        ) : null}
        <Row label="Medications">{s.S.medications.trim()}</Row>
        <Row label="Allergies">{s.S.allergies.trim()}</Row>
        <Row label="PMH">{s.S.pmh.trim()}</Row>
        <Row label="PSH">{s.S.psh.trim()}</Row>
        <Row label="Family hx">{s.S.familyHx.trim()}</Row>
        <Row label="Social hx">{s.S.socialHx.trim()}</Row>
        {ros.length ? (
          <View style={styles.para}>
            <Text style={styles.label}>Review of systems</Text>
            {ros.map((line) => (
              <Text key={line.system} style={styles.sub}>
                <Text style={styles.label}>{line.system}: </Text>
                {line.text}
              </Text>
            ))}
          </View>
        ) : null}

        <Text style={styles.sectionHeading}>O — OBJECTIVE</Text>
        <Row label="Vitals">{vitals}</Row>
        {bmi != null ? <Row label="BMI category">{bmiCategory(bmi)}</Row> : null}
        {exam.length ? (
          <View style={styles.para}>
            <Text style={styles.label}>Physical exam</Text>
            {exam.map((line) => (
              <Text key={line.system} style={styles.sub}>
                <Text style={styles.label}>{line.system}: </Text>
                {line.text}
              </Text>
            ))}
          </View>
        ) : null}
        {s.O.diagnostics.trim() ? (
          <View style={styles.para}>
            <Text style={styles.label}>Diagnostics</Text>
            <Text>{s.O.diagnostics.trim()}</Text>
          </View>
        ) : null}

        <Text style={styles.sectionHeading}>A — ASSESSMENT</Text>
        {s.A.diagnoses.length ? (
          s.A.diagnoses.map((dx, i) => (
            <View key={dx.id} style={styles.listItem} wrap={false}>
              <Text>
                <Text style={styles.label}>
                  {i + 1}. {i === 0 ? '[Primary] ' : `[Secondary ${i}] `}
                </Text>
                {[dx.code, dx.name].filter(Boolean).join(' — ')}
              </Text>
              {dx.reasoning.trim() ? <Text style={styles.sub}>{dx.reasoning.trim()}</Text> : null}
            </View>
          ))
        ) : (
          <Text style={styles.sub}>No diagnoses documented.</Text>
        )}
        {s.A.reasoning.trim() ? (
          <View style={styles.para}>
            <Text style={styles.label}>Clinical reasoning</Text>
            <Text>{s.A.reasoning.trim()}</Text>
          </View>
        ) : null}

        <Text style={styles.sectionHeading}>P — PLAN</Text>
        {s.P.blocks.map((block, i) => {
          const dx = s.A.diagnoses.find((d) => d.id === block.dxId)
          return (
            <View key={block.id} style={styles.listItem}>
              <Text style={styles.label}>
                {i + 1}. {dx ? [dx.code, dx.name].filter(Boolean).join(' — ') : 'General plan'}
              </Text>
              {block.medications.map((rx) => {
                const line = rxLine(rx)
                return line ? (
                  <Text key={rx.id} style={styles.sub}>
                    Rx: {line}
                  </Text>
                ) : null
              })}
              {[
                ['Orders', block.orders],
                ['Referrals', block.referrals],
                ['Education', block.education],
                ['Follow-up', block.followUp],
              ].map(([label, value]) =>
                value.trim() ? (
                  <Text key={label} style={styles.sub}>
                    <Text style={styles.label}>{label}: </Text>
                    {value.trim()}
                  </Text>
                ) : null,
              )}
            </View>
          )
        })}
        {s.P.general.trim() ? <Text style={styles.para}>{s.P.general.trim()}</Text> : null}

        <View style={styles.footer} fixed>
          <Text>Educational documentation — contains no protected health information.</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}

/** Build the PDF and hand back a Blob for download. */
export async function renderNotePdf(note, profile) {
  return pdf(<NoteDocument note={note} profile={profile} />).toBlob()
}
