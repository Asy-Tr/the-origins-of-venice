import os
import json
import re
from collections import Counter, defaultdict
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)

CORS(app, origins='*')


def extract_integers_from_string(s):
    if not isinstance(s, str):
        return None
    digits = re.findall(r'\d+', s)
    return int(''.join(digits)) if digits else None


def convert_map_number_to_int(map_number):
    if isinstance(map_number, int):
        return map_number
    elif isinstance(map_number, float):
        return int(round(map_number))
    elif isinstance(map_number, str):
        try:
            return int(round(float(map_number)))
        except ValueError:
            return None
    return None


def extract_and_group_by_time_based_on_ownership(data, start_time, end_time, entry_type):
    extracted_data = []
    for entry in data:
        date_start = entry.get("date_start")
        date_end = entry.get("date_end")
        if (date_start is not None and start_time <= date_start < end_time) or \
                (date_end is not None and start_time <= date_end < end_time):
            ownership_matches = entry.get("matches", {}).get("ownership", [])
            for match in ownership_matches:
                if match.get("entry_type") == entry_type and "entry_name" in match:
                    entry_name = match["entry_name"]
                    raw_area_code = entry.get("area_code")
                    area_code = extract_integers_from_string(raw_area_code) if raw_area_code else None
                    raw_map_number = entry.get("map_number")
                    map_number = convert_map_number_to_int(raw_map_number) if raw_map_number else None
                    source = entry.get("source")
                    extracted_data.append((entry_name, date_start, date_end, area_code, map_number, source))
    return extracted_data


def extract_and_group_by_time_based_on_frequency(data, start_time, end_time, entry_type):
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
                    map_number = convert_map_number_to_int(raw_map_number) if raw_map_number else None
                    source = entry.get("source")
                    extracted_data.append((entry_name, date_start, date_end, area_code, map_number, source))
    return extracted_data


@app.route("/run-python", methods=["POST"])
def run_python():
    # data = request.json
    print("success")
    return jsonify({"status": "success", "output": 1})


@app.route('/process-data', methods=['POST'])
def process_data():
    print("111")
    print(request.json)
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
    # print(top)
    # print(starting_time)
    folder_path = "../entities"
    file_list_path = os.path.join(folder_path, "files.json")

    if not os.path.exists(file_list_path):
        return jsonify({"status": "error", "message": "files.json not found."}), 400

    with open(file_list_path, 'r', encoding='utf-8') as f:
        try:
            json_files = json.load(f)
        except json.JSONDecodeError:
            return jsonify({"status": "error", "message": "Invalid JSON format in files.json."}), 400

    time_grouped_persons = []

    for file_name in json_files:
        file_path = os.path.join(folder_path, file_name)
        if not os.path.exists(file_path):
            continue
        with open(file_path, 'r', encoding='utf-8') as f:
            try:
                data = json.load(f)
            except json.JSONDecodeError:
                continue
            if isinstance(data, dict):
                data = [data]
            elif not isinstance(data, list):
                continue
            if based == "ownership":
                persons_by_time = extract_and_group_by_time_based_on_ownership(
                    data,
                    start_time=starting_time,
                    end_time=starting_time + 50,
                    entry_type=entry_type
                )
            else:
                persons_by_time = extract_and_group_by_time_based_on_frequency(
                    data,
                    start_time=starting_time,
                    end_time=starting_time + 50,
                    entry_type=entry_type
                )
            time_grouped_persons.extend(persons_by_time)

    if not time_grouped_persons:
        return jsonify({"status": "error", "message": "No matching records found."}), 404

    person_counter = Counter(element[0] for element in time_grouped_persons)
    top_k_times = person_counter.most_common(top)

    if not top_k_times:
        return jsonify({"status": "error", "message": "No data to process."}), 404

    top_k_names = set(name for name, _ in top_k_times)
    top_k_details = defaultdict(list)

    for element in time_grouped_persons:
        entry_name, date_start, date_end, area_code, map_number, source= element
        if entry_name in top_k_names:
            detail = {
                "area_code": area_code,
                "map_number": map_number,
                "source": source
            }
            top_k_details[entry_name].append(detail)

    top_k_details_dict = dict(top_k_details)
    return jsonify({"status": "success", "data": top_k_details_dict})


if __name__ == "__main__":
    app.run(debug=True)
