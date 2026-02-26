/**
 * Service to manage global metadata like official names and office details.
 */
class MetadataService {
    static getGlobalMetadata() {
        // This would eventually come from a database/settings table
        return {
            nama_puskesmas: "Puskesmas Kunjang",
            kepala_puskesmas: "dr. Budi Santoso",
            nip_kepala: "19800101 201001 1 001",
            ketua_tim_mutu: "Siti Aminah, S.Kep",
            alamat_kantor: "Jl. Raya Kunjang No. 123, Kediri",
            telepon: "(0354) 123456",
            kabupaten: "Kediri",
            tahun_anggaran: new Date().getFullYear().toString()
        };
    }

    static getUnits() {
        return [
            "Poli Umum",
            "Poli Gigi",
            "KIA/KB",
            "Farmasi",
            "Laboratorium",
            "TU / Administrasi",
            "Ujung Pandang"
        ];
    }
}

export default MetadataService;
