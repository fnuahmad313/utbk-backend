import { Request, Response } from "express";
import * as InfoService from "./info.service";

export const getJalur = async (req: Request, res: Response) => {
  try {
    const result = await InfoService.getJalur();
    res.json({ data: result });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getJalurBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const result = await InfoService.getJalurBySlug(slug as string);

    if (!result) {
      res.status(404).json({ message: "Jalur masuk tidak ditemukan" });
      return;
    }

    res.json({ data: result });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
