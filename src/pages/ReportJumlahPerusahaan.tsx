import { PrintLabelTemplate } from './PrintLabelPerusahaan'
import { requestReportJumlahPerusahaan } from '../services/reportJumlah'

const ReportJumlahPerusahaan = () => (
  <PrintLabelTemplate
    title="Report Jumlah Perusahaan"
    onSubmit={requestReportJumlahPerusahaan}
    labelTitle="Judul Jumlah Report"
    labelPlaceholder="Report Jumlah Perusahaan"
    previewTitle="Preview Report Jumlah"
    printTitle="Cetak Report Jumlah"
    noun="report jumlah"
    titleKey="judul_jumlah_report"
  />
)

export default ReportJumlahPerusahaan
