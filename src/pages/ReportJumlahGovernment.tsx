import { PrintLabelTemplate } from './PrintLabelPerusahaan'
import { requestReportJumlahGovernment } from '../services/reportJumlah'

const ReportJumlahGovernment = () => (
  <PrintLabelTemplate
    title="Report Jumlah Government"
    onSubmit={requestReportJumlahGovernment}
    labelTitle="Judul Jumlah Report"
    labelPlaceholder="Report Jumlah Government"
    previewTitle="Preview Report Jumlah"
    printTitle="Cetak Report Jumlah"
    noun="report jumlah"
    titleKey="judul_jumlah_report"
  />
)

export default ReportJumlahGovernment
