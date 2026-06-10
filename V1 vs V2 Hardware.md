# V1 vs V2 Hardware

- Version 1 controllers use a RP2040 pico controller with a larger footprint which mounts on a supporting lasercut frame.
- Version 2 controllers use still use a RP2040 but on the Pico Zero which has a smaller form and mounts to a custom PCB.

# Controller Pin Assignment
| Input | V1 Pin | v2 Pin |
| ----------- | ----------- | ----------- |
| Green Fret | 10 | 2 |
| Red Fret | 11 | 3 |
| Yellow Fret | 12 | 4 |
| Blue Fret | 13 | 5 |
| Orange Fret | 14 | 6 |
| Strum Up | 14 | 15 |
| Strum Down | 14 | 14 |
| Start | 1 | 0 |
| Select | 0 | 1 |
| Tilt | 9 | 12 |
| D-Pad Up | 2 | 11 |
| D-Pad Down | 3 | 10 |
| D-Pad Left | 4 | 9 |
| D-Pad Right | 5 | 8 |
| D-Pad Guide | 6 | 7 |
| Whammy | 27 | 29 |
| LED Data | 23 | 13 |

The differences in the hardware dictates the configuration to be different and therefore separate firmwares required.  Allowing the move between Classic and Santroller based firmwares required detection of hardware types to ensure the controller continued to function as expected and the creation of 4 firmware files.

# Firmware files
| Classic-v1.uf2 | Santroller-v1.uf2 |
| ---- | ---- |
| Classic-v2.uf2 | Santroller-v2.uf2 |
