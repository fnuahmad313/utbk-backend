import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import * as PTNService from './ptn.service';

// getPTNList
export const getPTNList = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { provinsi, tipe, akreditasi, search } = req.query;
    const filter = {
      provinsi: provinsi ? String(provinsi) : undefined,
      tipe: tipe ? String(tipe) : undefined,
      akreditasi: akreditasi ? String(akreditasi) : undefined,
      search: search ? String(search) : undefined,
    };

    const result = await PTNService.getPTNList(filter);
    res.json({ data: result.data });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

// getPTNById
export const getPTNById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await PTNService.getPTNById(id as string);

    if (result.error === 'ptn_not_found') {
      res.status(404).json({ message: 'PTN tidak ditemukan' });
      return;
    }

    res.json({ data: result.data });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

// createPTN
export const createPTN = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const result = await PTNService.createPTN(req.body);

    if (result.error === 'validation_error') {
      res.status(400).json({ message: result.message });
      return;
    }

    res.status(201).json({ data: result.data });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updatePTN = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await PTNService.updatePTN(id as string, req.body);

    if (result.error === 'ptn_not_found') {
      res.status(404).json({ message: 'PTN tidak ditemukan' });
      return;
    }

    if (result.error === 'validation_error') {
      res.status(400).json({ message: result.message });
      return;
    }

    res.json({ data: result.data });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

// deletePTN
export const deletePTN = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await PTNService.deletePTN(id as string);

    if (result.error === 'ptn_not_found') {
      res.status(404).json({ message: 'PTN tidak ditemukan' });
      return;
    }

    res.json({ message: result.message });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

// getJurusanByPTN
export const getJurusanByPTN = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { ptnId } = req.params;
    const { kelompok, jenjang, search } = req.query;
    const filter = {
      kelompok: kelompok ? String(kelompok) : undefined,
      jenjang: jenjang ? String(jenjang) : undefined,
      search: search ? String(search) : undefined,
    };

    const result = await PTNService.getJurusanByPTN(ptnId as string, filter);

    if (result.error === 'ptn_not_found') {
      res.status(404).json({ message: 'PTN tidak ditemukan' });
      return;
    }

    res.json({ data: result.data });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

// getJurusanList
export const getJurusanList = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { kelompok, jenjang, search } = req.query;
    const filter = {
      kelompok: kelompok ? String(kelompok) : undefined,
      jenjang: jenjang ? String(jenjang) : undefined,
      search: search ? String(search) : undefined,
    };

    const result = await PTNService.getJurusanList(filter);
    res.json({ data: result.data });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

// getJurusanById
export const getJurusanById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await PTNService.getJurusanById(id as string);

    if (result.error === 'jurusan_not_found') {
      res.status(404).json({ message: 'Jurusan tidak ditemukan' });
      return;
    }

    res.json({ data: result.data });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

// createJurusan
export const createJurusan = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const result = await PTNService.createJurusan(req.body);

    if (result.error === 'ptn_not_found') {
      res.status(404).json({ message: 'PTN tidak ditemukan' });
      return;
    }

    if (result.error === 'validation_error') {
      res.status(400).json({ message: result.message });
      return;
    }

    res.status(201).json({ data: result.data });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

// updateJurusan
export const updateJurusan = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await PTNService.updateJurusan(id as string, req.body);

    if (result.error === 'jurusan_not_found') {
      res.status(404).json({ message: 'Jurusan tidak ditemukan' });
      return;
    }

    if (result.error === 'ptn_not_found') {
      res.status(404).json({ message: 'PTN tidak ditemukan' });
      return;
    }

    if (result.error === 'validation_error') {
      res.status(400).json({ message: result.message });
      return;
    }

    res.json({ data: result.data });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

// deleteJurusan
export const deleteJurusan = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await PTNService.deleteJurusan(id as string);

    if (result.error === 'jurusan_not_found') {
      res.status(404).json({ message: 'Jurusan tidak ditemukan' });
      return;
    }

    res.json({ message: result.message });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};
