import json
import os
import re
from collections import Counter
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)

CORS(app, origins='*')


def extract_integers_from_string(s):
    if not isinstance(s, str):
        return None
    digits = re.findall(r'\d+', s)
    return int(''.join(digits)) if digits else None


def convert_map_id_to_int(map_id):
    if isinstance(map_id, int):
        return map_id
    elif isinstance(map_id, float):
        return int(round(map_id))
    elif isinstance(map_id, str):
        try:
            return int(round(float(map_id)))
        except ValueError:
            pass
    return None


def filter_by_time_based_on_ownership(data, start_time, end_time, entry_type):
    extracted_data = []
    for entry in data:
        date_start = entry.get("date_start")
        date_end = entry.get("date_end")
        if (date_start is not None and start_time <= date_start < end_time) or \
                (date_end is not None and start_time <= date_end < end_time):
            matches = entry.get("matches", {}).get("ownership", [])
            for match in matches:
                if match.get("entry_type") == entry_type and "entry_name" in match:
                    entry_name = match["entry_name"]
                    raw_area_code = entry.get("area_code")
                    area_code = extract_integers_from_string(raw_area_code) if raw_area_code else None
                    raw_map_number = entry.get("map_number")
                    map_number = convert_map_id_to_int(raw_map_number) if raw_map_number else None
                    source = entry.get("source")
                    extracted_data.append((entry_name, date_start, date_end, area_code, map_number, source))
    return extracted_data


def filter_by_time_based_on_frequency(data, start_time, end_time, entry_type):
    extracted_data = []
    for entry in data:
        date_start = entry.get("date_start")
        date_end = entry.get("date_end")
        if (date_start is not None and start_time <= date_start < end_time) or \
                (date_end is not None and start_time <= date_end < end_time):
            matches = entry.get("matches", {}).get("spatial_information", [])
            for match in matches:
                if match.get("entry_type") == entry_type and "entry_name" in match:
                    entry_name = match["entry_name"]
                    raw_area_code = entry.get("area_code")
                    area_code = extract_integers_from_string(raw_area_code) if raw_area_code else None
                    raw_map_number = entry.get("map_number")
                    map_number = convert_map_id_to_int(raw_map_number) if raw_map_number else None
                    source = entry.get("source")
                    extracted_data.append((entry_name, date_start, date_end, area_code, map_number, source))
    return extracted_data


@app.route('/process-data', methods=['POST'])
def process_data():
    based = request.json["based"]
    subtype = request.json["subtype"]
    top = request.json["top"]
    starting_time = request.json["starting_time"]
    if subtype == "person":
        entry_type = "persons (II)"
    elif subtype == "place":
        entry_type = "places (venice)"
    else:
        entry_type = "spatial_features"

    folder_path = "../entities"
    file_list_path = os.path.join(folder_path, "files.json")

    if not os.path.exists(file_list_path):
        return jsonify({"status": "error", "message": "files.json not found."}), 404

    with open(file_list_path, 'r', encoding='utf-8') as f:
        try:
            json_files = json.load(f)
        except json.JSONDecodeError:
            return jsonify({"status": "error", "message": "files.json is not a valid JSON file."}), 500

    time_filtered_results = []

    for file_name in json_files:
        file_path = os.path.join(folder_path, file_name)
        if not os.path.exists(file_path):
            return jsonify({"status": "error", "message": f"File {file_name} not found."}), 404
        with open(file_path, 'r', encoding='utf-8') as f:
            try:
                data = json.load(f)
            except json.JSONDecodeError:
                return jsonify({"status": "error", "message": f"File {file_name} is not a valid JSON file."}), 500
            if not isinstance(data, list):
                return jsonify({"status": "error", "message": f"File {file_name} is not a list."}), 500
            if based == "ownership":
                persons_by_time = filter_by_time_based_on_ownership(
                    data,
                    start_time=starting_time,
                    end_time=starting_time + 50,
                    entry_type=entry_type
                )
            else:
                persons_by_time = filter_by_time_based_on_frequency(
                    data,
                    start_time=starting_time,
                    end_time=starting_time + 50,
                    entry_type=entry_type
                )
            time_filtered_results.extend(persons_by_time)

    counter = Counter(entry[0] for entry in time_filtered_results)
    top_k_times = counter.most_common(top)

    top_k_names = set(name for name, _ in top_k_times)
    top_k_details = {}

    for element in time_filtered_results:
        entry_name, date_start, date_end, area_code, map_number, source = element
        if entry_name in top_k_names:
            detail = {
                "area_code": area_code,
                "map_id": map_number,
                "source": source
            }
            if entry_name not in top_k_details:
                top_k_details[entry_name] = []
            top_k_details[entry_name].append(detail)

    return jsonify({"status": "success", "data": top_k_details})


if __name__ == "__main__":
    app.run(debug=True)
