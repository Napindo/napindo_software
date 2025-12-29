import { PrintLabelTemplate } from './PrintLabelPerusahaan'
import { requestReportPerusahaan } from '../services/report'

const ReportPerusahaan = () => (
  <PrintLabelTemplate
    title="Report Perusahaan"
    onSubmit={requestReportPerusahaan}
    labelTitle="Judul Report"
    labelPlaceholder="Report Perusahaan"
    previewTitle="Preview Report"
    printTitle="Cetak Report"
    noun="report"
    titleKey="judul_report"
  />
)

export default ReportPerusahaan
