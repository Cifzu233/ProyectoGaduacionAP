param([string]$Docx, [string]$Pdf)
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
try {
  $doc = $word.Documents.Open($Docx, $false, $false)
  # Actualizar todos los campos (SEQ, PAGE) y las tablas de contenido
  $doc.Fields.Update() | Out-Null
  foreach ($toc in $doc.TablesOfContents) { $toc.Update() | Out-Null }
  foreach ($tof in $doc.TablesOfFigures) { $tof.Update() | Out-Null }
  $doc.Fields.Update() | Out-Null
  foreach ($toc in $doc.TablesOfContents) { $toc.UpdatePageNumbers() | Out-Null }
  foreach ($tof in $doc.TablesOfFigures) { $tof.UpdatePageNumbers() | Out-Null }
  $doc.Save()
  "Paginas: " + $doc.ComputeStatistics(2)
  "TOCs: " + $doc.TablesOfContents.Count + "  TOFs: " + $doc.TablesOfFigures.Count + "  Campos: " + $doc.Fields.Count
  try {
    $doc.SaveAs2([ref]$Pdf, [ref]17)
    "PDF: $Pdf"
  } catch {
    "SaveAs2 fallo: $($_.Exception.Message)"
    $doc.ExportAsFixedFormat2($Pdf, 17)
    "PDF (ExportAsFixedFormat2): $Pdf"
  }
  $doc.Close($false)
} finally {
  $word.Quit()
  [System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null
}
