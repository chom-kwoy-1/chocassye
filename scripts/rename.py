import pathlib
import shutil
import sys
import subprocess
from natsort import natsorted


def main():
    page_names_file, images_directory, book_name = sys.argv[1:5]

    new_dir_name = pathlib.Path(images_directory) / "renamed"

    with open(page_names_file, 'r') as f:
        page_names = f.readlines()
    page_names = [page_name.strip() for page_name in page_names if page_name.strip() != '']

    # List all .jpg files in the directory in sorted order
    image_files = natsorted([*pathlib.Path(images_directory).glob('*.jpg'), *pathlib.Path(images_directory).glob('*.png')])

    # compare the number of page names and images
    if len(page_names) != len(image_files):
        print(f'The number of page names and images do not match: '
              f'{len(page_names)} page names and {len(image_files)} images.')

        for i, image_path in enumerate(image_files):
            if i >= len(page_names):
                print(f'{image_path} -> No page name')
            else:
                print(f'{image_path} -> {page_names[i]}')

        # Bisect to find the first mismatch, through user feedback
        print('Bisecting to find the first mismatch')
        left = 0
        right = len(page_names)
        i = len(page_names) // 2
        while left < right:
            response = input(f'Is {image_files[i]} -> {page_names[i]} correct? (y/n) ')
            if response == 'y':
                left = i + 1
            elif response == 'n':
                right = i
            else:
                print('Invalid response')
                continue
            i = (left + right) // 2

        print(f'First mismatch at {i}: {image_files[i]} -> {page_names[i]}')

        return

    for i, image_path in enumerate(image_files):
        if i >= len(page_names):
            print(f'{image_path} -> No page name')
        else:
            print(f'{image_path} -> {page_names[i]}')

    pathlib.Path(new_dir_name).mkdir(exist_ok=True, parents=True)

    for i, image_path in enumerate(image_files):
        # Copy the image to the new directory with the new name
        new_image_path = pathlib.Path(new_dir_name) / f'{page_names[i]}.jpg'
        shutil.copy(image_path, new_image_path)

    # Upload to b2 bucket
    subprocess.run(['b2', 'sync', new_dir_name, f'b2://chocassye/scans/{book_name}/'])


if __name__ == '__main__':
    main()
