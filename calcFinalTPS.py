import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union


@dataclass
class FinalTpsResult:
    final_tps: float
    bpm: float
    base_beats: float
    effective_beats: float
    reached_score: int
    total_tiles: int
    source_note: str


def _parse_score_tokens(score_str: str) -> List[str]:
    """scores 文字列をタイル/イベント単位のトークン列に分割する"""
    if not score_str or not score_str.strip():
        return []
    # カンマ・セミコロン・改行・パイプ等で分割
    raw_tokens = re.split(r"[,;\n|]+", score_str.strip())
    return [t.strip() for t in raw_tokens if t.strip()]


def _extract_inline_bpm_and_beats(
    token: str, current_bpm: float, current_beats: float
) -> Tuple[float, float, bool]:
    """
    トークン内に BPM や拍間隔の指定が含まれる場合に更新する。
    例: "bpm:180", "bpm=180", "beats:0.5", "beats=0.25", "len=0.5"
    戻り値: (new_bpm, new_beats, is_tile_event)
    """
    bpm_match = re.search(r"\bbpm\s*[:=]\s*([0-9]+(?:\.[0-9]+)?)", token, re.IGNORECASE)
    beats_match = re.search(
        r"\b(?:beats|baseBeats|len|length)\s*[:=]\s*([0-9]+(?:\.[0-9]+)?)",
        token,
        re.IGNORECASE,
    )

    new_bpm = float(bpm_match.group(1)) if bpm_match else current_bpm
    new_beats = float(beats_match.group(1)) if beats_match else current_beats

    # 純粋なメタ指定のみのトークンか、タイルイベントを含むかを判定
    stripped = re.sub(
        r"\b(?:bpm|beats|baseBeats|len|length)\s*[:=]\s*[0-9]+(?:\.[0-9]+)?",
        "",
        token,
        flags=re.IGNORECASE,
    ).strip(" :/-")

    # タイル表記の例: "1-0.5", "2:0.25", "1", "a", "tile1"
    is_tile = bool(stripped)
    if stripped:
        # "ノート番号:拍数" または "ノート番号-拍数" の形式なら末尾の拍数を採用
        dur_only = re.search(r"[:\-/]\s*([0-9]+(?:\.[0-9]+)?)$", stripped)
        if dur_only and not beats_match:
            val = float(dur_only.group(1))
            if 0 < val <= 16:
                new_beats = val

    return new_bpm, new_beats, is_tile


def get_final_tps_from_json(
    song_json: Union[str, Path, Dict[str, Any]],
    score: int,
    music_id: Optional[Union[int, str]] = None,
    music_index: int = 0,
    fallback_bpm: Optional[float] = None,
) -> FinalTpsResult:
    """
    曲の JSON とスコア（到達タイル数: 1以上）を受け取り、最終 TPS を取得する。
    """
    if score < 1:
        raise ValueError("score は 1 以上の整数を指定してください。")

    if isinstance(song_json, (str, Path)):
        path = Path(song_json)
        if path.exists() and path.is_file():
            data = json.loads(path.read_text(encoding="utf-8"))
        else:
            data = json.loads(str(song_json))
    elif isinstance(song_json, dict):
        data = song_json
    else:
        raise TypeError("song_json はファイルパス、JSON文字列、または dict を指定してください。")

    musics: List[Dict[str, Any]] = data.get("musics") or []
    selected_music: Dict[str, Any] = {}

    if music_id is not None:
        for m in musics:
            if str(m.get("id")) == str(music_id):
                selected_music = m
                break
        if not selected_music:
            raise KeyError(f"指定された music_id='{music_id}' が musics 内に見つかりません。")
    elif musics:
        if not (0 <= music_index < len(musics)):
            raise IndexError(f"music_index={music_index} は範囲外です（要素数: {len(musics)}）。")
        selected_music = musics[music_index]

    # BPM の決定優先順位: selected_music["bpm"] -> fallback_bpm -> data["baseBpm"]
    raw_bpm = selected_music.get("bpm")
    if raw_bpm is None:
        raw_bpm = fallback_bpm if fallback_bpm is not None else data.get("baseBpm")
    if raw_bpm is None or float(raw_bpm) <= 0:
        raise ValueError("有効な BPM（musics[].bpm または baseBpm）が見つかりません。")

    current_bpm = float(raw_bpm)

    # baseBeats の取得（デフォルト 0.5）
    raw_base_beats = selected_music.get("baseBeats", 0.5)
    base_beats = float(raw_base_beats)
    if base_beats <= 0:
        raise ValueError("baseBeats は 0 より大きい値を指定してください。")

    current_beats = base_beats

    scores_list = selected_music.get("scores") or []
    if not isinstance(scores_list, list):
        scores_list = [str(scores_list)]

    # 全パスからタイルイベント列を走査し、指定 score までの状態を取得
    # 複数パスがある場合は最長のタイル列（または最初の有効パス）を基準にする
    best_path_tiles: List[Tuple[float, float]] = []
    for path_str in scores_list:
        if not isinstance(path_str, str):
            continue
        tokens = _parse_score_tokens(path_str)
        path_tiles: List[Tuple[float, float]] = []
        p_bpm = current_bpm
        p_beats = current_beats

        for tok in tokens:
            p_bpm, p_beats, is_tile = _extract_inline_bpm_and_beats(tok, p_bpm, p_beats)
            if is_tile:
                path_tiles.append((p_bpm, p_beats))

        if len(path_tiles) > len(best_path_tiles):
            best_path_tiles = path_tiles

    total_tiles = len(best_path_tiles)

    if total_tiles > 0:
        clamped_idx = min(score, total_tiles) - 1
        final_bpm, effective_beats = best_path_tiles[clamped_idx]
        reached_score = min(score, total_tiles)
        source_note = (
            f"scoresから {total_tiles} タイルを検出（到達位置: {reached_score}/{total_tiles}）"
        )
    else:
        # scores が空または未解析形式の場合でも musics の bpm / baseBeats から算出
        final_bpm = current_bpm
        effective_beats = base_beats
        reached_score = score
        source_note = "scoresにタイル列がないため musics の bpm / baseBeats から算出"

    final_tps = final_bpm / (60.0 * effective_beats)

    return FinalTpsResult(
        final_tps=final_tps,
        bpm=final_bpm,
        base_beats=base_beats,
        effective_beats=effective_beats,
        reached_score=reached_score,
        total_tiles=total_tiles,
        source_note=source_note,
    )


if __name__ == "__main__":
    sample_json = {
        "baseBpm": 180,
        "musics": [
            {
                "id": 1,
                "bpm": 261,
                "baseBeats": 0.5,
                "scores": [
                    "1,2,3,4,1,2,3,4,bpm=280,1,2,3,4,1,2"
                ],
            }
        ],
    }

    for test_score in [5, 12]:
        res = get_final_tps_from_json(sample_json, score=test_score, music_id=1)
        print(
            f"Score={test_score} -> 最終TPS: {res.final_tps:.3f} "
            f"(BPM={res.bpm}, beats={res.effective_beats}, {res.source_note})"
        )