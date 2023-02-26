import React, { Component } from "react";
import {
  View,
  Image,
  Dimensions,
  Text,
  ScrollView,
  TouchableOpacity,
  PixelRatio,
  PanResponder,
  Animated,
} from "react-native";
import MapView, { AnimatedRegion, Marker } from "react-native-maps";
import { em, getDistanceFromLatLonInKm, randomString } from "./CommonFunctions";
import { captureRef } from "react-native-view-shot";
import { SaveFormat, manipulateAsync, FlipType } from "expo-image-manipulator";
import Data from "./Data.json";
const screen = Dimensions.get("window");
const ASPECT_RATIO = screen.width / screen.height;
const LATITUDE_DELTA = 0.04;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;
const currLocation = {
  latitude: 22.12334,
  longitude: 77.652524,
};

class Index extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showSearchView: false,
      detailViewData: [],
    };
    this.chargersData = Data;
    this.maxDistance = 0;
    this.maxDistanceLat = currLocation.latitude;
    this.maxDistanceLon = currLocation.longitude;
    this.minDistance = -1;
    this.minDistanceLat = currLocation.latitude;
    this.minDistanceLon = currLocation.longitude;
  }
  pan = new Animated.ValueXY();
  panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return gestureState.dx != 0 && gestureState.dy != 0;
    },
    onPanResponderMove: Animated.event([
      null,
      { dx: this.pan.x, dy: this.pan.y },
    ]),
    onPanResponderRelease: () => {
      this.pan.extractOffset();
    },
  });
  componentDidMount() {
    if (
      !!Array.isArray(this.chargersData.chargers) &&
      !!this.chargersData.chargers.length
    ) {
      this.chargersData.chargers = this.chargersData.chargers.map(
        (charger, index) => {
          let distance = getDistanceFromLatLonInKm(
            charger.latitude.toString(),
            charger.longitude.toString(),
            currLocation.latitude,
            currLocation.longitude
          );
          distance *= 1000;
          if (distance > this.maxDistance) {
            this.maxDistanceLat = Number(charger.latitude);
            this.maxDistanceLon = Number(charger.longitude);
            this.maxDistance = distance;
          }
          if (distance <= this.minDistance) {
            this.minDistanceLat = Number(charger.latitude);
            this.minDistanceLon = Number(charger.longitude);
            this.minDistance = distance;
          }
          return {
            ...charger,
            name: "expressway charging - mariam enterprise" + randomString(10),
            id: "a001" + randomString(5),
            address: "connaught place, delhi" + randomString(8),
            distance: distance.toFixed(0),
          };
        }
      );
      var detailViewData = [];
      for (
        let index = 0;
        index < this.chargersData.chargers.length;
        index += 2
      ) {
        detailViewData = [
          ...detailViewData,
          [
            this.chargersData.chargers[index],
            this.chargersData.chargers[index + 1],
          ],
        ];
      }
      this.setState({ detailViewData });
    }
  }
  _onMapReady = () => {
    this._mapRef?.fitToCoordinates(
      [
        {
          latitude: currLocation.latitude,
          longitude: currLocation.longitude,
        },
        { latitude: this.maxDistanceLat, longitude: this.maxDistanceLon },
      ],
      {
        edgePadding: {
          right: 30,
          bottom: 30,
          left: 200,
          top: 30,
        },
        animated: true,
      }
    );
  };
  makeApiCall = (data) => {
    console.log({data})
    let body = new FormData();
    body.append("photo", {
      uri: data.uri,
      name: "photo.png",
      filename: "imageName.png",
      type: "image/png",
    });
    body.append("Content-Type", "image/png");

    fetch("http://3.7.20.173:8503/api/upload/", {
      method: "POST",
      headers: {
        "Content-Type": "multipart/form-data",
      },
      body: body,
    })
      .then((res) => console.log(res))
      .then((res) => res.json())
      .then((res) => {
        console.log("response" + JSON.stringify(res));
      })
      .catch((e) => console.log(e));
  };
  renderDetailView = (charger, index) => {
    let [first, second] = charger;
    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: em(16),
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "black",
            padding: em(16),
            borderRadius: 12,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontWeight: "600",
                  fontSize: em(16),
                  lineHeight: em(20),
                  color: "white",
                }}
                numberOfLines={1}
              >
                {first.name.toUpperCase()}
              </Text>
              <View
                style={{
                  flex: 1,
                  flexDirection: "row",
                }}
              >
                <Text
                  style={{
                    fontWeight: "500",
                    color: "#979799",
                    fontSize: em(12),
                    lineHeight: em(14),
                    flex: 1,
                  }}
                  numberOfLines={1}
                >
                  {first.address}
                </Text>
                <Text
                  style={{
                    flex: 1,
                    fontWeight: "500",
                    color: "red",
                    fontSize: em(12),
                    lineHeight: em(14),
                  }}
                >
                  {(first.distance / 1000).toFixed(1)}km
                </Text>
              </View>
            </View>
            <Image
              source={require("./images/placeholder_2.png")}
              style={{
                width: em(15),
                height: em(15),
              }}
            />
          </View>
          <Text
            numberOfLines={1}
            style={{
              fontSize: em(14),
              lineHeight: em(20),
              color: "#fff",
              marginTop: em(8),
              fontWeight: "600",
            }}
          >
            SUPPORTED CONNECTORS
          </Text>
          {first.connector_types.map((connector) => {
            if (!connector) {
              return null;
            }
            const splitIndex = connector.indexOf("-");
            const name = connector.slice(0, splitIndex);
            const quantity = connector.slice(splitIndex + 1);
            return (
              <View
                style={{
                  marginTop: em(8),
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flex: 1,
                  }}
                >
                  <View
                    style={{
                      width: em(30),
                      height: em(30),
                      backgroundColor: "white",
                      borderRadius: 15,
                      marginRight: em(4),
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <View
                      style={{
                        width: em(15),
                        height: em(15),
                        backgroundColor: "black",
                        borderRadius: 7.5,
                      }}
                    />
                  </View>
                  <View
                    style={{
                      flex: 1,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: em(14),
                        lineHeight: em(16),
                        color: "white",
                        fontWeight: "600",
                      }}
                      numberOfLines={1}
                    >
                      {name}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={{
                        fontSize: em(14),
                        lineHeight: em(16),
                        color: "#44D7B5",
                        fontWeight: "500",
                      }}
                    >
                      description xyz
                    </Text>
                  </View>
                </View>
                <Text
                  style={{
                    fontSize: em(14),
                    lineHeight: em(16),
                    color: "white",
                    fontWeight: "600",
                  }}
                >
                  x{quantity}
                </Text>
              </View>
            );
          })}
          <Image
            source={require("./images/arrow_down.png")}
            style={{
              width: em(15),
              height: em(15),
              tintColor: "white",
              marginTop: em(16),
              alignSelf: "center",
            }}
          />
        </View>
        <View style={{ height: "100%", width: em(8) }} />
        <View
          style={{
            flex: 1,
            backgroundColor: "black",
            padding: em(16),
            borderRadius: 12,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontWeight: "600",
                  fontSize: em(16),
                  lineHeight: em(20),
                  color: "white",
                }}
                numberOfLines={1}
              >
                {second.name.toUpperCase()}
              </Text>
              <View
                style={{
                  flex: 1,
                  flexDirection: "row",
                }}
              >
                <Text
                  style={{
                    fontWeight: "500",
                    color: "#979799",
                    fontSize: em(12),
                    lineHeight: em(14),
                    flex: 1,
                  }}
                  numberOfLines={1}
                >
                  {second.address}
                </Text>
                <Text
                  style={{
                    flex: 1,
                    fontWeight: "500",
                    color: "red",
                    fontSize: em(12),
                    lineHeight: em(14),
                  }}
                >
                  {(second.distance / 1000).toFixed(1)}km
                </Text>
              </View>
            </View>
            <Image
              source={require("./images/placeholder_2.png")}
              style={{
                width: em(15),
                height: em(15),
              }}
            />
          </View>
          <Text
            numberOfLines={1}
            style={{
              fontSize: em(14),
              lineHeight: em(20),
              color: "#fff",
              marginTop: em(8),
              fontWeight: "600",
            }}
          >
            SUPPORTED CONNECTORS
          </Text>
          {second.connector_types.map((connector) => {
            if (!connector) {
              return null;
            }
            const splitIndex = connector.indexOf("-");
            const name = connector.slice(0, splitIndex);
            const quantity = connector.slice(splitIndex + 1);
            return (
              <View
                style={{
                  marginTop: em(8),
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flex: 1,
                  }}
                >
                  <View
                    style={{
                      width: em(30),
                      height: em(30),
                      backgroundColor: "white",
                      borderRadius: 15,
                      marginRight: em(4),
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <View
                      style={{
                        width: em(15),
                        height: em(15),
                        backgroundColor: "black",
                        borderRadius: 7.5,
                      }}
                    />
                  </View>
                  <View
                    style={{
                      flex: 1,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: em(14),
                        lineHeight: em(16),
                        color: "white",
                        fontWeight: "600",
                      }}
                      numberOfLines={1}
                    >
                      {name}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={{
                        fontSize: em(14),
                        lineHeight: em(16),
                        color: "#44D7B5",
                        fontWeight: "500",
                      }}
                    >
                      description xyz
                    </Text>
                  </View>
                </View>
                <Text
                  style={{
                    fontSize: em(14),
                    lineHeight: em(16),
                    color: "white",
                    fontWeight: "600",
                  }}
                >
                  x{quantity}
                </Text>
              </View>
            );
          })}
          <Image
            source={require("./images/arrow_down.png")}
            style={{
              width: em(15),
              height: em(15),
              tintColor: "white",
              marginTop: em(16),
              alignSelf: "center",
            }}
          />
        </View>
      </View>
    );
  };
  render() {
    return (
      <View
        style={{
          flex: 1,
        }}
      >
        <MapView
          style={{
            width: screen.width,
            height: screen.height,
          }}
          ref={(ref) => {
            this._mapRef = ref;
          }}
          onMapReady={this._onMapReady}
          initialRegion={{
            ...currLocation,
            latitudeDelta: LATITUDE_DELTA,
            longitudeDelta: LONGITUDE_DELTA,
          }}
        >
          <Marker
            coordinate={{
              latitude: Number(currLocation.latitude),
              longitude: Number(currLocation.longitude),
            }}
            title={"my location"}
          >
            <Image
              style={{
                width: em(30),
                hieght: em(30),
              }}
              source={require("./images/placeholder.png")}
            />
          </Marker>
          {!!this.chargersData &&
            Array.isArray(this.chargersData.chargers) &&
            this.chargersData.chargers.map((charger, index) => {
              if (!charger || !charger.latitude || !charger.longitude) {
                return null;
              }
              return (
                <Marker
                  coordinate={{
                    latitude: Number(charger.latitude),
                    longitude: Number(charger.longitude),
                  }}
                  title={charger.latitude + ": " + charger.longitude || ""}
                  description={charger.address || ""}
                  style={{
                    backgroundColor: "#44D7B5",
                    height: em(30),
                    width: em(30),
                    borderRadius: 15,
                    alignItems: "center",
                    justifyContent: "center",
               
                  }}
                >
                  <Text
                    style={{
                      fontWeight: "600",
                    }}
                  >
                    {index}
                  </Text>
                </Marker>
              );
            })}
        </MapView>
        <View
          style={{
            position: "absolute",
            bottom: 8,
            height: screen.height * 0.3,
            width: screen.width,
          }}
        >
          <ScrollView
            contentContainerStyle={{
              padding: em(16),
            }}
          >
            {this.state.detailViewData.map(this.renderDetailView)}
          </ScrollView>
        </View>
        <Animated.View
          style={{
            backgroundColor: "black",
            position: "absolute",
            top:screen.height/2,
            right: em(16),
            borderRadius: 25,
            transform: [{ translateX: this.pan.x }, { translateY: this.pan.y }],
          }}
          {...this.panResponder.panHandlers}
        >
          <TouchableOpacity
            onPress={async () => {
              const targetPixelCount = 1080;
              const pixelRatio = PixelRatio.get();
              const pixels = targetPixelCount / pixelRatio;

              const result = await captureRef(this._mapRef, {
                result: "tmpfile",
                height: pixels,
                width: pixels,
                quality: 1,
                format: "png",
              });
              // const manipulatedImage = await manipulateAsync(
              //   result,
              //   [{ rotate: 180 }, { flip: FlipType.Horizontal }],
              //   { compress: 1, format: SaveFormat.WEBP }
              // );
              // console.log(manipulatedImage,result)
              this.makeApiCall(result);
            }}
            style={{
              height: em(50),
              width: em(50),
              backgroundColor: "black",
              borderRadius: 25,
            }}
          />
        </Animated.View>
      </View>
    );
  }
}

export default Index;
