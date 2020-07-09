/**
 * File types
 *
 * These types are restricted to a set of common file formats.
 */

export enum FileType {
  FQ = 'FastaQ file',
  FA = 'Fasta file',
  ALN = 'Alignment (SAM/BAM)',
  TBL = 'General data table',
  MTX = 'Numeric table',
  I_MTX = 'Integer table',
  ANN = 'Annotation table',
  BED = 'BED-format file'
}
