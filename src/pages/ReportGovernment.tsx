import { PrintLabelTemplate } from './PrintLabelPerusahaan'
import { requestReportGovernment } from '../services/report'

const ReportGovernment = () => (
  <PrintLabelTemplate
    title="Report Government"
    onSubmit={requestReportGovernment}
    labelTitle="Judul Report"
    labelPlaceholder="Report Government"
    previewTitle="Preview Report"
    printTitle="Cetak Report"
    noun="report"
    titleKey="judul_report"
  />
)

export default ReportGovernment
